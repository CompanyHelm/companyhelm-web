import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TaskEditModal } from "../../src/components/TaskEditModal.tsx";

function renderTaskEditModalMarkup(taskOverrides: Record<string, unknown> = {}, onOpenTaskThread: (threadId: string) => void = () => {}) {
  const task = {
    id: "task-1",
    name: "Task 1",
    description: "Task description",
    dependencyTaskIds: [],
    comments: [],
    ...taskOverrides,
  };

  return renderToStaticMarkup(
    React.createElement(TaskEditModal, {
      task,
      tasks: [task],
      agents: [
        {
          id: "agent-1",
          name: "Agent One",
        },
      ],
      principals: [
        {
          id: "principal-user-1",
          kind: "user",
          displayName: "Jane Doe",
        },
      ],
      relationshipDraft: {
        dependencyTaskIds: [],
        parentTaskId: "",
        childTaskIds: [],
        assigneePrincipalId: "",
        status: "draft",
      },
      savingTaskId: null,
      commentingTaskId: null,
      deletingTaskId: null,
      onDraftChange: () => {},
      onSaveRelationships: () => true,
      onExecuteTask: () => true,
      onCreateTaskComment: () => true,
      onDeleteTask: () => {},
      onOpenTaskThread,
      onClose: () => {},
    }),
  );
}

test("TaskEditModal shows a fallback message when task thread is not present", () => {
  const markup = renderTaskEditModalMarkup({ threadId: null });

  assert.match(markup, /Thread not present\./);
});

test("TaskEditModal shows the thread id and open action when task thread exists", () => {
  const markup = renderTaskEditModalMarkup({ threadId: "thread-123" });

  assert.match(markup, /thread-123/);
  assert.match(markup, /Open thread chat/);
});

test("TaskEditModal shows assignee and status controls", () => {
  const markup = renderTaskEditModalMarkup();

  assert.match(markup, />Assignee</);
  assert.match(markup, />Status</);
  assert.match(markup, /Execute task/);
});

test("TaskEditModal shows comment creator principal and type badge", () => {
  const markup = renderTaskEditModalMarkup({
    comments: [
      {
        id: "comment-1",
        comment: "Needs review",
        createdAt: "2026-03-05T08:00:00.000Z",
        authorPrincipal: {
          id: "principal-user-1",
          kind: "user",
          displayName: "Jane Doe",
        },
      },
    ],
  });

  assert.match(markup, /Jane Doe/);
  assert.match(markup, /Human/);
});
