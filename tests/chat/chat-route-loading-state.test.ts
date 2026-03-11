import assert from "node:assert/strict";
import test from "node:test";
import { shouldSuppressChatsRouteMissingAgentWarning } from "../../src/App.tsx";

test("shouldSuppressChatsRouteMissingAgentWarning returns true while chats bootstrap is still resolving the route agent", () => {
  assert.equal(
    shouldSuppressChatsRouteMissingAgentWarning({
      activePage: "chats",
      routeAgentId: "agent-missing",
      chatAgentId: "agent-missing",
      isLoadingChatIndex: true,
      agents: [],
    }),
    true,
  );
});

test("shouldSuppressChatsRouteMissingAgentWarning returns false after loading when the route agent is still missing", () => {
  assert.equal(
    shouldSuppressChatsRouteMissingAgentWarning({
      activePage: "chats",
      routeAgentId: "agent-missing",
      chatAgentId: "agent-missing",
      isLoadingChatIndex: false,
      agents: [],
    }),
    false,
  );
});

test("shouldSuppressChatsRouteMissingAgentWarning returns false when the route agent is already known", () => {
  assert.equal(
    shouldSuppressChatsRouteMissingAgentWarning({
      activePage: "chats",
      routeAgentId: "agent-1",
      chatAgentId: "agent-1",
      isLoadingChatIndex: true,
      agents: [{ id: "agent-1", name: "Build Agent" }],
    }),
    false,
  );
});
