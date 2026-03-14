import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TasksPage } from "../../src/pages/TasksPage.tsx";
import type { TaskItem } from "../../src/types/domain.ts";

function renderTasksPageMarkup(taskOverrides: Partial<TaskItem> = {}) {
  const rootTask: TaskItem = {
    id: "task-1",
    name: "Fix graph rendering",
    description: "Repair the task graph page.",
    status: "in_progress",
    dependencyTaskIds: [],
    comments: [
      {
        id: "comment-1",
        comment: "Graph is blank in the browser.",
        createdAt: "2026-03-08T09:30:00.000Z",
        authorActor: {
          id: "actor-user-1",
          kind: "user",
          displayName: "Jane Doe",
        },
      },
    ],
    ...taskOverrides,
  };
  const childTask: TaskItem = {
    id: "task-2",
    name: "Investigate React Flow container sizing",
    parentTaskId: "task-1",
    status: "pending",
    dependencyTaskIds: [],
    comments: [],
  };

  return renderToStaticMarkup(
    React.createElement(TasksPage, {
      tasks: [rootTask, childTask],
      taskOptions: [rootTask, childTask],
      agents: [],
      actors: [
        {
          id: "actor-user-1",
          kind: "user",
          displayName: "Jane Doe",
        },
      ],
      isLoadingTasks: false,
      taskError: "",
      isSubmittingTask: false,
      savingTaskId: null,
      commentingTaskId: null,
      deletingTaskId: null,
      name: "",
      description: "",
      assigneeActorId: "",
      status: "draft",
      parentTaskId: "",
      dependencyTaskIds: [],
      relationshipDrafts: {},
      onNameChange: () => {},
      onDescriptionChange: () => {},
      onAssigneeActorIdChange: () => {},
      onStatusChange: () => {},
      onParentTaskIdChange: () => {},
      onDependencyTaskIdsChange: () => {},
      onCreateTask: () => true,
      onCreateAndExecuteTask: () => true,
      onDraftChange: () => {},
      onSaveRelationships: () => true,
      onExecuteTask: () => true,
      onAddDependency: () => {},
      onCreateTaskComment: () => true,
      onDeleteTask: () => {},
      onBatchDeleteTasks: () => true,
      onBatchExecuteTasks: () => true,
      onOpenTaskThread: () => {},
      activeTaskId: "task-1",
      visibleDepth: "3",
      onVisibleDepthChange: () => {},
      onOpenTask: () => {},
      onBackToTasks: () => {},
    }),
  );
}

test("TasksPage overview tab shows existing comments and add comment controls", () => {
  const markup = renderTasksPageMarkup();

  assert.match(markup, />Comments</);
  assert.match(markup, /Graph is blank in the browser\./);
  assert.match(markup, /Jane Doe/);
  assert.match(markup, /Add comment/);
  assert.match(markup, /overview-task-comment-draft/);
});

test("TasksPage overview tab shows an empty-state message when no comments exist", () => {
  const markup = renderTasksPageMarkup({ comments: [] });

  assert.match(markup, /No comments yet\./);
});

test("TasksPage detail actions show a visible create subtask action", () => {
  const markup = renderTasksPageMarkup();

  assert.match(markup, />Create subtask</);
  assert.match(markup, />Edit task dependencies</);
  assert.match(markup, />Execute task</);
});
