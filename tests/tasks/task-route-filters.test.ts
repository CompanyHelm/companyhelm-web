import assert from "node:assert/strict";
import test from "node:test";
import { filterTasksForAssigneeUserId } from "../../src/tasks/relay/task-route-filters.ts";

test("filterTasksForAssigneeUserId keeps only tasks assigned to the selected human user", () => {
  const result = filterTasksForAssigneeUserId({
    tasks: [
      {
        id: "task-parent",
        name: "Parent task",
        assigneeActor: {
          id: "actor-user-1",
          kind: "user",
          displayName: "User One",
          userId: "user-1",
        },
        parentTaskId: null,
      },
      {
        id: "task-child",
        name: "Child task",
        assigneeActor: {
          id: "actor-user-1",
          kind: "user",
          displayName: "User One",
          userId: "user-1",
        },
        parentTaskId: "task-parent",
      },
      {
        id: "task-other",
        name: "Other task",
        assigneeActor: {
          id: "actor-user-2",
          kind: "user",
          displayName: "User Two",
          userId: "user-2",
        },
        parentTaskId: null,
      },
    ],
    taskOptions: [
      { id: "TaskOption:task-parent", taskId: "task-parent", name: "Parent task", parentTaskId: null },
      { id: "TaskOption:task-child", taskId: "task-child", name: "Child task", parentTaskId: "task-parent" },
      { id: "TaskOption:task-other", taskId: "task-other", name: "Other task", parentTaskId: null },
    ],
    assigneeUserId: "user-1",
  });

  assert.deepEqual(
    result.tasks.map((task) => task.id),
    ["task-parent", "task-child"],
  );
  assert.deepEqual(
    result.taskOptions.map((task) => ({ id: task.id, parentTaskId: task.parentTaskId ?? null })),
    [
      { id: "task-parent", parentTaskId: null },
      { id: "task-child", parentTaskId: "task-parent" },
    ],
  );
});

test("filterTasksForAssigneeUserId drops non-matching parents from the filtered hierarchy", () => {
  const result = filterTasksForAssigneeUserId({
    tasks: [
      {
        id: "task-parent",
        name: "Parent task",
        assigneeActor: {
          id: "actor-user-2",
          kind: "user",
          displayName: "User Two",
          userId: "user-2",
        },
        parentTaskId: null,
      },
      {
        id: "task-child",
        name: "Child task",
        assigneeActor: {
          id: "actor-user-1",
          kind: "user",
          displayName: "User One",
          userId: "user-1",
        },
        parentTaskId: "task-parent",
      },
    ],
    taskOptions: [
      { id: "TaskOption:task-parent", taskId: "task-parent", name: "Parent task", parentTaskId: null },
      { id: "TaskOption:task-child", taskId: "task-child", name: "Child task", parentTaskId: "task-parent" },
    ],
    assigneeUserId: "user-1",
  });

  assert.deepEqual(
    result.taskOptions.map((task) => ({ id: task.id, parentTaskId: task.parentTaskId ?? null })),
    [{ id: "task-child", parentTaskId: null }],
  );
});
