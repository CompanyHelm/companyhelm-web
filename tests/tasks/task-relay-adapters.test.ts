import assert from "node:assert/strict";
import test from "node:test";
import {
  toTaskRouteViewModel,
  shouldRefetchTaskRoute,
} from "../../src/tasks/relay/adapters.ts";

test("toTaskRouteViewModel adapts Relay task route data into legacy TasksPage props", () => {
  const viewModel = toTaskRouteViewModel({
    tasks: [
      {
        id: "task-1",
        company: { id: "company-1" },
        name: "Ship Relay route",
        description: "Move tasks to Relay.",
        acceptanceCriteria: "Tasks page loads from Relay.",
        assigneeActorId: "actor-user-1",
        assigneeActor: {
          id: "actor-user-1",
          kind: "user",
          displayName: "Jane Doe",
          agentId: null,
          userId: "user-1",
          email: "jane@example.com",
        },
        parentTaskId: null,
        status: "in_progress",
        createdAt: "2026-03-12T10:00:00.000Z",
        updatedAt: "2026-03-12T11:00:00.000Z",
        runs: [
          {
            id: "run-1",
            taskId: "task-1",
            status: "failed",
            threadId: "thread-1",
            agentId: "agent-1",
            triggeredByActorId: "actor-user-1",
            failureMessage: "Runner disconnected",
            startedAt: "2026-03-12T10:10:00.000Z",
            finishedAt: "2026-03-12T10:11:00.000Z",
            createdAt: "2026-03-12T10:10:00.000Z",
            updatedAt: "2026-03-12T10:11:00.000Z",
          },
        ],
        latestRun: {
          id: "run-1",
          taskId: "task-1",
          status: "failed",
          threadId: "thread-1",
          agentId: "agent-1",
          triggeredByActorId: "actor-user-1",
          failureMessage: "Runner disconnected",
          startedAt: "2026-03-12T10:10:00.000Z",
          finishedAt: "2026-03-12T10:11:00.000Z",
          createdAt: "2026-03-12T10:10:00.000Z",
          updatedAt: "2026-03-12T10:11:00.000Z",
        },
        activeRun: null,
        attemptCount: 1,
        lastRunStatus: "failed",
        dependencyTaskIds: [],
        comments: [
          {
            id: "comment-1",
            taskId: "task-1",
            comment: "Use Relay-generated artifacts.",
            authorActorId: "actor-user-1",
            authorActor: {
              id: "actor-user-1",
              kind: "user",
              displayName: "Jane Doe",
              agentId: null,
              userId: "user-1",
              email: "jane@example.com",
            },
            createdAt: "2026-03-12T11:05:00.000Z",
            updatedAt: "2026-03-12T11:05:00.000Z",
          },
        ],
      },
    ],
    taskOptions: [
      {
        id: "task-1",
        name: "Ship Relay route",
        parentTaskId: null,
      },
      {
        id: "task-2",
        name: "Refactor tasks App branch",
        parentTaskId: "task-1",
      },
    ],
    taskAssignableActors: [
      {
        id: "actor-user-1",
        kind: "user",
        displayName: "Jane Doe",
        agentId: null,
        userId: "user-1",
        email: "jane@example.com",
      },
    ],
    agents: {
      edges: [
        {
          node: {
            id: "agent-1",
            name: "Build Agent",
          },
        },
      ],
    },
  });

  assert.equal(viewModel.tasks.length, 1);
  assert.equal(viewModel.tasks[0]?.id, "task-1");
  assert.equal(viewModel.tasks[0]?.assigneeActor?.displayName, "Jane Doe");
  assert.equal(viewModel.tasks[0]?.latestRun?.status, "failed");
  assert.equal(viewModel.tasks[0]?.attemptCount, 1);
  assert.equal(viewModel.tasks[0]?.threadId, "thread-1");
  assert.equal(viewModel.tasks[0]?.assigneeActor?.displayName, "Jane Doe");
  assert.equal(viewModel.taskOptions[1]?.parentTaskId, "task-1");
  assert.equal(viewModel.actors[0]?.email, "jane@example.com");
  assert.equal(viewModel.agents[0]?.name, "Build Agent");
});

test("shouldRefetchTaskRoute returns true for membership-changing task updates", () => {
  assert.equal(
    shouldRefetchTaskRoute({
      membershipChanged: true,
      deletedTaskIds: [],
    }),
    true,
  );
});

test("shouldRefetchTaskRoute returns true when the active task was deleted", () => {
  assert.equal(
    shouldRefetchTaskRoute({
      membershipChanged: false,
      deletedTaskIds: ["task-1"],
      activeTaskId: "task-1",
    }),
    true,
  );
});

test("shouldRefetchTaskRoute returns false for record-only updates on other tasks", () => {
  assert.equal(
    shouldRefetchTaskRoute({
      membershipChanged: false,
      deletedTaskIds: ["task-2"],
      activeTaskId: "task-1",
    }),
    false,
  );
});
