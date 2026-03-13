import assert from "node:assert/strict";
import test from "node:test";
import type { TaskItem } from "../../src/types/domain.ts";
import { TasksPageModalState } from "../../src/pages/TasksPageModalState.ts";

const activeTask: TaskItem = {
  id: "task-1",
  name: "Ship task detail flow",
  description: "Fix the task detail page modal state.",
  status: "in_progress",
  dependencyTaskIds: [],
  comments: [],
};

test("TasksPageModalState resolves the relationship modal task from the active detail task", () => {
  const resolvedTask = TasksPageModalState.resolveEditTask({
    isOpen: true,
    activeTask,
    requestedTaskId: "task-1",
    visibleTaskById: new Map(),
  });

  assert.equal(resolvedTask?.id, "task-1");
});

test("TasksPageModalState presets subtask creation to the active task id", () => {
  const parentTaskId = TasksPageModalState.getCreateParentTaskId({
    action: "create-subtask",
    activeTask,
  });

  assert.equal(parentTaskId, "task-1");
});

test("TasksPageModalState keeps top-level task creation unparented", () => {
  const parentTaskId = TasksPageModalState.getCreateParentTaskId({
    action: "create-task",
    activeTask,
  });

  assert.equal(parentTaskId, "");
});
