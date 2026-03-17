import assert from "node:assert/strict";
import test from "node:test";

async function loadChatRouteNavigationModule() {
  try {
    return await import("../../src/utils/chat-route-navigation.ts");
  } catch {
    return {} as any;
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

test("resolveLoadedChatsRoute stays on /chats when no agent can be resolved", async () => {
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
      path: "/chats",
    },
  );
});

test("resolveExplicitChatsRoute returns not_found for an explicit missing agent", async () => {
  const moduleRecord = await loadChatRouteNavigationModule();
  assert.equal(typeof moduleRecord.resolveExplicitChatsRoute, "function");

  assert.deepEqual(
    moduleRecord.resolveExplicitChatsRoute({
      requestedAgentId: "agent-missing",
      requestedThreadId: "",
      availableAgents: [{ id: "agent-1" }],
      sessionsByAgent: {
        "agent-1": [{ id: "thread-1" }],
      },
    }),
    {
      kind: "not_found",
      message: "Agent not found.",
      agentId: "agent-missing",
      threadId: "",
      path: "/chats?agentId=agent-missing",
    },
  );
});

test("resolveExplicitChatsRoute returns not_found for an explicit missing thread", async () => {
  const moduleRecord = await loadChatRouteNavigationModule();
  assert.equal(typeof moduleRecord.resolveExplicitChatsRoute, "function");

  assert.deepEqual(
    moduleRecord.resolveExplicitChatsRoute({
      requestedAgentId: "agent-1",
      requestedThreadId: "thread-missing",
      availableAgents: [{ id: "agent-1" }],
      sessionsByAgent: {
        "agent-1": [{ id: "thread-1" }],
      },
    }),
    {
      kind: "not_found",
      message: "Chat not found.",
      agentId: "agent-1",
      threadId: "thread-missing",
      path: "/chats?agentId=agent-1&threadId=thread-missing",
    },
  );
});

test("resolveExplicitChatsRoute preserves an exact thread-only route when the thread is loaded", async () => {
  const moduleRecord = await loadChatRouteNavigationModule();
  assert.equal(typeof moduleRecord.resolveExplicitChatsRoute, "function");

  assert.deepEqual(
    moduleRecord.resolveExplicitChatsRoute({
      requestedAgentId: "",
      requestedThreadId: "thread-2",
      availableAgents: [{ id: "agent-2" }],
      sessionsByAgent: {
        "agent-2": [{ id: "thread-2" }],
      },
    }),
    {
      kind: "exact",
      message: "",
      agentId: "agent-2",
      threadId: "thread-2",
      path: "/chats?agentId=agent-2&threadId=thread-2",
    },
  );
});
