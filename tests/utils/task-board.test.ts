import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTaskBoardColumns,
  filterTasksByCategories,
} from "../../src/utils/task-board.ts";

const tasks = [
  { id: "task-1", name: "Spec board", category: "Backlog" },
  { id: "task-2", name: "Ship board", category: "Shipping" },
  { id: "task-3", name: "Inbox cleanup", category: "" },
];

test("filterTasksByCategories keeps all tasks when no category filter is active", () => {
  assert.deepEqual(
    filterTasksByCategories(tasks, []),
    tasks,
  );
});

test("filterTasksByCategories supports multi-select including uncategorized", () => {
  assert.deepEqual(
    filterTasksByCategories(tasks, ["Shipping", "uncategorized"]),
    [tasks[1], tasks[2]],
  );
});

test("buildTaskBoardColumns returns task columns for configured categories plus uncategorized", () => {
  assert.deepEqual(
    buildTaskBoardColumns({
      tasks,
      taskCategories: [
        { id: "task-category-1", name: "Backlog" },
        { id: "task-category-2", name: "Shipping" },
      ],
    }).map((column) => ({
      key: column.key,
      taskIds: column.tasks.map((task) => task.id),
    })),
    [
      { key: "Backlog", taskIds: ["task-1"] },
      { key: "Shipping", taskIds: ["task-2"] },
      { key: "uncategorized", taskIds: ["task-3"] },
    ],
  );
});
