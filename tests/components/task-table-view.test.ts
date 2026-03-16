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
            lastRunStatus: "failed",
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

test("TaskTableView renders the run column with the latest run status", () => {
  const markup = renderTaskTableViewMarkup();

  assert.match(markup, />Run</);
  assert.match(markup, /task-status-pill-failed/);
  assert.match(markup, />failed</);
});

test("TaskTableView renders a running indicator beside tasks with an active running run", () => {
  const originalWindow = testGlobal.window;

  try {
    testGlobal.window = {
      localStorage: createMockStorage(new Map()),
    } as Window & typeof globalThis;

    const markup = renderToStaticMarkup(
      React.createElement(TaskTableView, {
        tasks: [
          {
            id: "task-1",
            name: "Ship table changes",
            status: "in_progress",
            hasRunningThreads: true,
            dependencyTaskIds: [],
            comments: [],
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

    assert.match(markup, /task-table-running-indicator/);
    assert.match(markup, /Task run in progress/);
  } finally {
    if (typeof originalWindow === "undefined") {
      Reflect.deleteProperty(testGlobal, "window");
    } else {
      testGlobal.window = originalWindow;
    }
  }
});

test("TaskTableView uses a neutral fallback when task names are missing", () => {
  const originalWindow = testGlobal.window;

  try {
    testGlobal.window = {
      localStorage: createMockStorage(new Map()),
    } as Window & typeof globalThis;

    const markup = renderToStaticMarkup(
      React.createElement(TaskTableView, {
        tasks: [
          {
            id: "task-secret-1",
            name: "",
            status: "pending",
            description: "Make the table configurable",
            dependencyTaskIds: [],
            comments: [],
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

    assert.match(markup, /Untitled task/);
    assert.doesNotMatch(markup, /Task task-secret-1/);
    assert.doesNotMatch(markup, /Select task task-secret-1/);
  } finally {
    if (typeof originalWindow === "undefined") {
      Reflect.deleteProperty(testGlobal, "window");
    } else {
      testGlobal.window = originalWindow;
    }
  }
});
