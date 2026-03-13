import assert from "node:assert/strict";
import test from "node:test";
import { normalizeThreadTaskList, toThreadTaskStatusLabel } from "../../src/utils/thread-tasks.ts";

test("normalizeThreadTaskList sorts tasks by active status first, then recency", () => {
  const tasks = normalizeThreadTaskList([
    {
      id: "task-completed",
      name: "Completed task",
      status: "completed",
      updatedAt: "2026-03-01T13:00:00.000Z",
    },
    {
      id: "task-pending",
      name: "Pending task",
      status: "pending",
      updatedAt: "2026-03-01T12:00:00.000Z",
    },
    {
      id: "task-active",
      name: "Active task",
      status: "in_progress",
      updatedAt: "2026-03-01T11:00:00.000Z",
    },
    {
      id: "task-draft",
      name: "Draft task",
      status: "draft",
      updatedAt: "2026-03-01T10:00:00.000Z",
    },
  ]);

  assert.deepEqual(
    tasks.map((task) => `${task.id}:${task.status}`),
    [
      "task-active:in_progress",
      "task-pending:pending",
      "task-draft:draft",
      "task-completed:completed",
    ],
  );
});

test("toThreadTaskStatusLabel formats status values for chat UI", () => {
  assert.equal(toThreadTaskStatusLabel("in_progress"), "in progress");
  assert.equal(toThreadTaskStatusLabel("pending"), "pending");
});

test("normalizeThreadTaskList uses a neutral fallback when task names are missing", () => {
  const tasks = normalizeThreadTaskList([
    {
      id: "task-without-name",
      status: "pending",
      updatedAt: "2026-03-01T12:00:00.000Z",
    },
  ]);

  assert.equal(tasks[0]?.name, "Untitled task");
});
