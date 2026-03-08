import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TaskTableView } from "../../src/components/TaskTableView.tsx";
import { TASK_TABLE_COLUMNS_STORAGE_KEY } from "../../src/utils/constants.ts";

type GlobalWithWindow = typeof global & {
  window?: Window & typeof globalThis;
};

const testGlobal = global as GlobalWithWindow;

function createMockStorage(storageMap: Map<string, string>): Storage {
  return {
    get length() {
      return storageMap.size;
    },
    clear() {
      storageMap.clear();
    },
    key(index: number) {
      return Array.from(storageMap.keys())[index] ?? null;
    },
    getItem(key: string) {
      return storageMap.has(key) ? storageMap.get(key) || null : null;
    },
    setItem(key: string, value: string) {
      storageMap.set(key, String(value));
    },
    removeItem(key: string) {
      storageMap.delete(key);
    },
  };
}

function renderTaskTableViewMarkup(storedVisibleColumns?: string) {
  const originalWindow = testGlobal.window;
  const storageMap = new Map<string, string>();

  if (typeof storedVisibleColumns === "string") {
    storageMap.set(TASK_TABLE_COLUMNS_STORAGE_KEY, storedVisibleColumns);
  }

  try {
    testGlobal.window = {
      localStorage: createMockStorage(storageMap),
    } as Window & typeof globalThis;

    return renderToStaticMarkup(
      React.createElement(TaskTableView, {
        tasks: [
          {
            id: "task-1",
            name: "Ship table changes",
            status: "pending",
            description: "Make the table configurable",
            dependencyTaskIds: [],
            comments: [{ id: "comment-1" }],
            createdAt: "2026-03-08T10:00:00.000Z",
          },
        ],
        agents: [],
        onTaskClick: () => {},
        onDeleteTask: () => {},
        onBatchDeleteTasks: async () => true,
        onBatchExecuteTasks: async () => true,
      }),
    );
  } finally {
    if (typeof originalWindow === "undefined") {
      Reflect.deleteProperty(testGlobal, "window");
    } else {
      testGlobal.window = originalWindow;
    }
  }
}

test("TaskTableView renders a Columns trigger in the toolbar", () => {
  const markup = renderTaskTableViewMarkup();

  assert.match(markup, />Columns</);
});

test("TaskTableView hides optional columns that are not visible", () => {
  const markup = renderTaskTableViewMarkup(JSON.stringify(["status", "created"]));

  assert.match(markup, />Status</);
  assert.match(markup, />Created</);
  assert.doesNotMatch(markup, />Description</);
  assert.doesNotMatch(markup, />Blocked by</);
});

test("TaskTableView falls back to default columns when stored visibility is invalid", () => {
  const markup = renderTaskTableViewMarkup("{invalid json");

  assert.match(markup, />Description</);
  assert.match(markup, />Blocked by</);
  assert.match(markup, />Comments</);
});
