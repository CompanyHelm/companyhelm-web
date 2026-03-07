import assert from "node:assert/strict";
import test from "node:test";
import type { TaskItem } from "../../src/types/domain.ts";
import {
  getDescendantTaskTree,
  getDirectChildTasks,
  getTaskSubtree,
  getTopLevelTasks,
} from "../../src/utils/task-hierarchy.ts";

const tasks: TaskItem[] = [
  { id: "task-1", name: "Launch workspace" },
  { id: "task-2", name: "API setup", parentTaskId: "task-1" },
  { id: "task-3", name: "Frontend shell", parentTaskId: "task-1" },
  { id: "task-4", name: "Task page", parentTaskId: "task-3" },
  { id: "task-5", name: "Ops review" },
  { id: "task-6", name: "Orphaned child", parentTaskId: "missing-parent" },
];

test("getTopLevelTasks returns tasks without parents plus orphaned items", () => {
  assert.deepEqual(
    getTopLevelTasks(tasks).map((task) => task.id),
    ["task-1", "task-5", "task-6"],
  );
});

test("getDirectChildTasks returns only immediate children for the selected task", () => {
  assert.deepEqual(
    getDirectChildTasks(tasks, "task-1").map((task) => task.id),
    ["task-2", "task-3"],
  );
});

test("getTaskSubtree returns the root task with descendants in traversal order", () => {
  assert.deepEqual(
    getTaskSubtree(tasks, "task-1").map((task) => task.id),
    ["task-1", "task-2", "task-3", "task-4"],
  );
});

test("getTaskSubtree respects the requested max depth", () => {
  assert.deepEqual(
    getTaskSubtree(tasks, "task-1", 1).map((task) => task.id),
    ["task-1", "task-2", "task-3"],
  );
});

test("getTaskSubtree returns an empty list for unknown tasks", () => {
  assert.deepEqual(getTaskSubtree(tasks, "missing"), []);
});

test("getDescendantTaskTree returns descendants with depth for tree rendering", () => {
  assert.deepEqual(
    getDescendantTaskTree(tasks, "task-1").map(({ task, depth }) => `${task.id}:${depth}`),
    ["task-2:0", "task-3:0", "task-4:1"],
  );
});

test("getDescendantTaskTree respects the requested max depth", () => {
  assert.deepEqual(
    getDescendantTaskTree(tasks, "task-1", 1).map(({ task, depth }) => `${task.id}:${depth}`),
    ["task-2:0", "task-3:0"],
  );
});
