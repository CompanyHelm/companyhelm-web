import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TaskBoardView } from "../../src/components/TaskBoardView.tsx";

test("TaskBoardView renders category columns and uncategorized tasks", () => {
  const markup = renderToStaticMarkup(
    React.createElement(TaskBoardView, {
      tasks: [
        {
          id: "task-1",
          name: "Spec board",
          category: "Backlog",
          status: "in_progress",
          hasRunningThreads: true,
          runningThreadId: "thread-1",
        },
        { id: "task-2", name: "Ship board", category: "" },
      ],
      taskCategories: [
        { id: "task-category-1", name: "Backlog" },
      ],
      onTaskClick: () => {},
      onOpenTaskThread: () => {},
      onTaskCategoryDrop: () => true,
    }),
  );

  assert.match(markup, />Backlog</);
  assert.match(markup, />Uncategorized</);
  assert.match(markup, /Spec board/);
  assert.match(markup, /Ship board/);
  assert.match(markup, />in_progress</);
  assert.match(markup, /aria-label="Task run in progress"/);
  assert.match(markup, /aria-label="Open thread"/);
});
