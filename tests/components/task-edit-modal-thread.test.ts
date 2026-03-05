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
      relationshipDraft: {
        dependencyTaskIds: [],
        parentTaskId: "",
        childTaskIds: [],
      },
      savingTaskId: null,
      commentingTaskId: null,
      deletingTaskId: null,
      onDraftChange: () => {},
      onSaveRelationships: () => true,
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
