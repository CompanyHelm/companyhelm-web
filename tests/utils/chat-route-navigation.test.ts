import assert from "node:assert/strict";
import test from "node:test";

async function loadChatRouteNavigationModule() {
  try {
    return await import("../../src/utils/chat-route-navigation.ts");
  } catch {
    return {};
  }
}

test("buildImmediateChatsPath returns /chats for a plain chats click", async () => {
  const moduleRecord = await loadChatRouteNavigationModule();
  assert.equal(typeof moduleRecord.buildImmediateChatsPath, "function");

  assert.equal(moduleRecord.buildImmediateChatsPath(), "/chats");
});

test("buildImmediateChatsPath preserves a known agent and thread", async () => {
  const moduleRecord = await loadChatRouteNavigationModule();
  assert.equal(typeof moduleRecord.buildImmediateChatsPath, "function");

  assert.equal(
    moduleRecord.buildImmediateChatsPath({
      agentId: "agent-1",
      threadId: "thread-1",
    }),
    "/chats?agentId=agent-1&threadId=thread-1",
  );
});

test("buildImmediateChatsPath allows thread-only deep links", async () => {
  const moduleRecord = await loadChatRouteNavigationModule();
  assert.equal(typeof moduleRecord.buildImmediateChatsPath, "function");

  assert.equal(
    moduleRecord.buildImmediateChatsPath({
      threadId: "thread-1",
    }),
    "/chats?threadId=thread-1",
  );
});

test("findAgentIdForChatThread locates the owning agent from loaded session snapshots", async () => {
  const moduleRecord = await loadChatRouteNavigationModule();
  assert.equal(typeof moduleRecord.findAgentIdForChatThread, "function");

  assert.equal(
    moduleRecord.findAgentIdForChatThread({
      threadId: "thread-2",
      sessionsByAgent: {
        "agent-1": [{ id: "thread-1" }],
        "agent-2": [{ id: "thread-2" }],
      },
    }),
    "agent-2",
  );
});

test("resolveLoadedChatsRoute keeps compact navigation on the agent list route", async () => {
  const moduleRecord = await loadChatRouteNavigationModule();
  assert.equal(typeof moduleRecord.resolveLoadedChatsRoute, "function");

  assert.deepEqual(
    moduleRecord.resolveLoadedChatsRoute({
      availableAgents: [{ id: "agent-1" }],
      sessionsByAgent: {
        "agent-1": [{ id: "thread-1" }],
      },
      forceList: true,
    }),
    {
      agentId: "agent-1",
      threadId: "",
      path: "/chats?agentId=agent-1",
    },
  );
});

test("resolveLoadedChatsRoute auto-opens the first thread on wide layouts", async () => {
  const moduleRecord = await loadChatRouteNavigationModule();
  assert.equal(typeof moduleRecord.resolveLoadedChatsRoute, "function");

  assert.deepEqual(
    moduleRecord.resolveLoadedChatsRoute({
      requestedAgentId: "agent-1",
      availableAgents: [{ id: "agent-1" }],
      sessionsByAgent: {
        "agent-1": [{ id: "thread-1" }, { id: "thread-2" }],
      },
      openFirstThread: true,
    }),
    {
      agentId: "agent-1",
      threadId: "thread-1",
      path: "/chats?agentId=agent-1&threadId=thread-1",
    },
  );
});

test("resolveLoadedChatsRoute falls back to /agents when no agent can be resolved", async () => {
  const moduleRecord = await loadChatRouteNavigationModule();
  assert.equal(typeof moduleRecord.resolveLoadedChatsRoute, "function");

  assert.deepEqual(
    moduleRecord.resolveLoadedChatsRoute({
      requestedThreadId: "thread-missing",
      availableAgents: [],
      sessionsByAgent: {},
      openFirstThread: true,
    }),
    {
      agentId: "",
      threadId: "",
      path: "/agents",
    },
  );
});
