import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TaskCreateModal } from "../../src/components/TaskCreateModal.tsx";

function renderTaskCreateModalMarkup({
  assigneeActorId = "",
}: {
  assigneeActorId?: string;
} = {}) {
  return renderToStaticMarkup(
    React.createElement(TaskCreateModal, {
      isOpen: true,
      onClose: () => {},
      tasks: [],
      actors: [
        {
          id: "actor-agent-1",
          kind: "agent",
          displayName: "Agent One",
          agentId: "agent-1",
        },
        {
          id: "actor-user-1",
          kind: "user",
          displayName: "Jane Doe",
        },
      ],
      name: "Ship task modal cleanup",
      description: "",
      assigneeActorId,
      status: "draft",
      parentTaskId: "",
      dependencyTaskIds: [],
      isSubmittingTask: false,
      onNameChange: () => {},
      onDescriptionChange: () => {},
      onAssigneeActorIdChange: () => {},
      onStatusChange: () => {},
      onParentTaskIdChange: () => {},
      onDependencyTaskIdsChange: () => {},
      onCreateTask: () => true,
      onCreateAndExecuteTask: () => true,
    }),
  );
}

test("TaskCreateModal infers create-and-execute from the assignee instead of showing a separate agent selector", () => {
  const markup = renderTaskCreateModalMarkup({ assigneeActorId: "actor-agent-1" });

  assert.doesNotMatch(markup, />Execute with agent</);
  assert.match(markup, /Create &amp; Execute uses the assigned agent automatically\./);
  assert.doesNotMatch(markup, /title="Assign the task to an agent to execute it\."/);
});

test("TaskCreateModal disables create-and-execute when the assignee is not an agent", () => {
  const markup = renderTaskCreateModalMarkup({ assigneeActorId: "actor-user-1" });

  assert.match(markup, /title="Assign the task to an agent to execute it\."/);
  assert.match(markup, /<button type="button" disabled="" title="Assign the task to an agent to execute it\.">Create &amp; Execute<\/button>/);
});
