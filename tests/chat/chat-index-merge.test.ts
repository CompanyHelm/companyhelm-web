import assert from "node:assert/strict";
import test from "node:test";
import { mergeChatSessionsByAgentSnapshot } from "../../src/utils/chat.ts";

test("mergeChatSessionsByAgentSnapshot clears known agents missing from the latest snapshot", () => {
  const result = mergeChatSessionsByAgentSnapshot({
    currentSessionsByAgent: {
      "agent-1": [{ id: "thread-1" }],
      "agent-2": [{ id: "thread-2" }],
    },
    snapshotSessionsByAgent: {
      "agent-1": [{ id: "thread-1-updated" }],
    },
    knownAgentIds: ["agent-1", "agent-2"],
  });

  assert.deepEqual(result, {
    "agent-1": [{ id: "thread-1-updated" }],
    "agent-2": [],
  });
});

test("mergeChatSessionsByAgentSnapshot applies explicit empty snapshots for an agent", () => {
  const result = mergeChatSessionsByAgentSnapshot({
    currentSessionsByAgent: {
      "agent-1": [{ id: "thread-1" }],
      "agent-2": [{ id: "thread-2" }],
    },
    snapshotSessionsByAgent: {
      "agent-1": [],
    },
    knownAgentIds: ["agent-1", "agent-2"],
  });

  assert.deepEqual(result, {
    "agent-1": [],
    "agent-2": [],
  });
});

test("mergeChatSessionsByAgentSnapshot clears known agents when the latest snapshot is empty", () => {
  const result = mergeChatSessionsByAgentSnapshot({
    currentSessionsByAgent: {
      "agent-1": [{ id: "thread-1" }],
    },
    snapshotSessionsByAgent: {},
    knownAgentIds: ["agent-1", "agent-2"],
  });

  assert.deepEqual(result, {
    "agent-1": [],
    "agent-2": [],
  });
});
