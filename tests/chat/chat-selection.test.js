import assert from "node:assert/strict";
import test from "node:test";
import { isSameChatSelection } from "../../src/utils/chat.js";

test("isSameChatSelection returns true for the same agent and session ids", () => {
  const sameSelection = isSameChatSelection({
    currentAgentId: "agent-1",
    currentSessionId: "thread-1",
    nextAgentId: "agent-1",
    nextSessionId: "thread-1",
  });

  assert.equal(sameSelection, true);
});

test("isSameChatSelection returns false when the session id changes", () => {
  const sameSelection = isSameChatSelection({
    currentAgentId: "agent-1",
    currentSessionId: "thread-1",
    nextAgentId: "agent-1",
    nextSessionId: "thread-2",
  });

  assert.equal(sameSelection, false);
});

test("isSameChatSelection returns false when ids are missing", () => {
  const sameSelection = isSameChatSelection({
    currentAgentId: "agent-1",
    currentSessionId: "thread-1",
    nextAgentId: "agent-1",
    nextSessionId: "",
  });

  assert.equal(sameSelection, false);
});
