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
      actors: [
        {
          id: "actor-user-1",
          kind: "user",
          displayName: "Jane Doe",
        },
      ],
      relationshipDraft: {
        dependencyTaskIds: [],
        parentTaskId: "",
        childTaskIds: [],
        assigneeActorId: "",
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

test("TaskEditModal hides the thread id and shows only the open action when task thread exists", () => {
  const markup = renderTaskEditModalMarkup({ threadId: "thread-123" });

  assert.match(markup, /Open thread chat/);
  assert.doesNotMatch(markup, /thread-123/);
});

test("TaskEditModal shows assignee and status controls", () => {
  const markup = renderTaskEditModalMarkup();

  assert.match(markup, />Assignee</);
  assert.match(markup, />Status</);
  assert.match(markup, /Execute task/);
});

test("TaskEditModal shows comment creator actor and type badge", () => {
  const markup = renderTaskEditModalMarkup({
    comments: [
      {
        id: "comment-1",
        comment: "Needs review",
        createdAt: "2026-03-05T08:00:00.000Z",
        authorActor: {
          id: "actor-user-1",
          kind: "user",
          displayName: "Jane Doe",
        },
      },
    ],
  });

  assert.match(markup, /Jane Doe/);
  assert.match(markup, /Human/);
});

test("TaskEditModal uses a neutral fallback when a comment author name is missing", () => {
  const markup = renderTaskEditModalMarkup({
    comments: [
      {
        id: "comment-1",
        comment: "Needs review",
        createdAt: "2026-03-05T08:00:00.000Z",
        authorActorId: "actor-user-1",
        authorActor: {
          id: "actor-user-1",
          kind: "user",
          displayName: "",
        },
      },
    ],
  });

  assert.match(markup, /Unknown actor/);
  assert.doesNotMatch(markup, /<span class="chat-card-meta">actor-user-1/);
});
