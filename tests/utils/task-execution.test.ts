import assert from "node:assert/strict";
import test from "node:test";
import { buildTaskExecutionPlan } from "../../src/utils/task-execution.ts";

test("buildTaskExecutionPlan uses task assignees first and fallback for unassigned tasks", () => {
  const executionPlan = buildTaskExecutionPlan({
    taskIds: ["task-1", "task-2", "task-3", "task-4"],
    tasks: [
      { id: "task-1", assigneeAgentId: "agent-a" },
      { id: "task-2", assigneeAgentId: "" },
      { id: "task-3", assigneeAgentId: "agent-b" },
      { id: "task-4", assigneeAgentId: null },
    ],
    fallbackAgentId: " fallback-agent ",
  });

  assert.deepEqual(executionPlan, {
    missingTaskIds: [],
    groups: [
      { agentId: "agent-a", taskIds: ["task-1"] },
      { agentId: "fallback-agent", taskIds: ["task-2", "task-4"] },
      { agentId: "agent-b", taskIds: ["task-3"] },
    ],
  });
});

test("buildTaskExecutionPlan marks tasks as missing when there is no assignee and no fallback", () => {
  const executionPlan = buildTaskExecutionPlan({
    taskIds: ["task-1", "task-2"],
    tasks: [
      { id: "task-1", assigneeAgentId: "agent-a" },
      { id: "task-2", assigneeAgentId: "" },
    ],
    fallbackAgentId: "",
  });

  assert.deepEqual(executionPlan, {
    missingTaskIds: ["task-2"],
    groups: [{ agentId: "agent-a", taskIds: ["task-1"] }],
  });
});

test("buildTaskExecutionPlan normalizes task ids and routes unknown selected tasks through fallback when available", () => {
  const executionPlan = buildTaskExecutionPlan({
    taskIds: [" task-1 ", "task-1", "task-2", "task-3"],
    tasks: [
      { id: "task-1", assigneeAgentId: "agent-a" },
      { id: "task-2", assigneeAgentId: "agent-b" },
    ],
    fallbackAgentId: "fallback-agent",
  });

  assert.deepEqual(executionPlan, {
    missingTaskIds: [],
    groups: [
      { agentId: "agent-a", taskIds: ["task-1"] },
      { agentId: "agent-b", taskIds: ["task-2"] },
      { agentId: "fallback-agent", taskIds: ["task-3"] },
    ],
  });
});

test("buildTaskExecutionPlan treats unknown task ids as missing when no fallback is available", () => {
  const executionPlan = buildTaskExecutionPlan({
    taskIds: ["task-1", "task-3"],
    tasks: [{ id: "task-1", assigneeAgentId: "agent-a" }],
    fallbackAgentId: "",
  });

  assert.deepEqual(executionPlan, {
    missingTaskIds: ["task-3"],
    groups: [{ agentId: "agent-a", taskIds: ["task-1"] }],
  });
});

test("buildTaskExecutionPlan treats user-assigned tasks as missing without fallback", () => {
  const executionPlan = buildTaskExecutionPlan({
    taskIds: ["task-1", "task-2"],
    tasks: [
      { id: "task-1", assigneeAgentId: null },
      { id: "task-2", assigneeAgentId: "agent-b" },
    ],
    fallbackAgentId: "",
  });

  assert.deepEqual(executionPlan, {
    missingTaskIds: ["task-1"],
    groups: [{ agentId: "agent-b", taskIds: ["task-2"] }],
  });
});
