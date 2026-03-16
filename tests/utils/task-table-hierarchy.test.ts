import assert from "node:assert/strict";
import test from "node:test";
import { buildTaskTableHierarchyRows } from "../../src/utils/task-table-hierarchy.ts";

const tasks = [
  { id: "task-1", name: "Root" },
  { id: "task-2", name: "Child A", parentTaskId: "task-1" },
  { id: "task-3", name: "Grandchild", parentTaskId: "task-2" },
  { id: "task-4", name: "Child B", parentTaskId: "task-1" },
  { id: "task-5", name: "Standalone" },
];

test("buildTaskTableHierarchyRows keeps subtasks hidden until their parent is expanded", () => {
  const rows = buildTaskTableHierarchyRows(tasks, new Set());

  assert.deepEqual(
    rows.map((row) => ({ id: row.task.id, depth: row.depth, hasChildren: row.hasChildren })),
    [
      { id: "task-1", depth: 0, hasChildren: true },
      { id: "task-5", depth: 0, hasChildren: false },
    ],
  );
});

test("buildTaskTableHierarchyRows reveals descendants in tree order for expanded parents", () => {
  const rows = buildTaskTableHierarchyRows(tasks, new Set(["task-1", "task-2"]));

  assert.deepEqual(
    rows.map((row) => ({ id: row.task.id, depth: row.depth })),
    [
      { id: "task-1", depth: 0 },
      { id: "task-2", depth: 1 },
      { id: "task-3", depth: 2 },
      { id: "task-4", depth: 1 },
      { id: "task-5", depth: 0 },
    ],
  );
});
