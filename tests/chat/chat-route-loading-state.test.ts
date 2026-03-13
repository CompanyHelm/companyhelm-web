import assert from "node:assert/strict";
import test from "node:test";
import * as AppModule from "../../src/App.tsx";

const { shouldSuppressChatsRouteMissingAgentWarning } = AppModule as Record<string, any>;

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

test("shouldKeepThreadOnlyChatsRoutePending returns true while a thread-only chats route is still resolving", () => {
  const { shouldKeepThreadOnlyChatsRoutePending } = AppModule as Record<string, any>;

  assert.equal(typeof shouldKeepThreadOnlyChatsRoutePending, "function");
  assert.equal(
    shouldKeepThreadOnlyChatsRoutePending({
      activePage: "chats",
      routeAgentId: "",
      routeThreadId: "thread-1",
      chatAgentId: "",
      isLoadingChatIndex: true,
    }),
    true,
  );
});

test("shouldKeepThreadOnlyChatsRoutePending returns false after loading completes without an agent match", () => {
  const { shouldKeepThreadOnlyChatsRoutePending } = AppModule as Record<string, any>;

  assert.equal(typeof shouldKeepThreadOnlyChatsRoutePending, "function");
  assert.equal(
    shouldKeepThreadOnlyChatsRoutePending({
      activePage: "chats",
      routeAgentId: "",
      routeThreadId: "thread-1",
      chatAgentId: "",
      isLoadingChatIndex: false,
    }),
    false,
  );
});

test("shouldKeepThreadOnlyChatsRoutePending returns false when the route already includes an agent", () => {
  const { shouldKeepThreadOnlyChatsRoutePending } = AppModule as Record<string, any>;

  assert.equal(typeof shouldKeepThreadOnlyChatsRoutePending, "function");
  assert.equal(
    shouldKeepThreadOnlyChatsRoutePending({
      activePage: "chats",
      routeAgentId: "agent-1",
      routeThreadId: "thread-1",
      chatAgentId: "",
      isLoadingChatIndex: true,
    }),
    false,
  );
});

test("shouldKeepExplicitChatsRoutePending returns true while an explicit chats route is still resolving", () => {
  const { shouldKeepExplicitChatsRoutePending } = AppModule as Record<string, any>;

  assert.equal(typeof shouldKeepExplicitChatsRoutePending, "function");
  assert.equal(
    shouldKeepExplicitChatsRoutePending({
      activePage: "chats",
      routeAgentId: "agent-1",
      routeThreadId: "thread-new",
      isLoadingChatIndex: true,
      hasResolvedExactThread: false,
      routeResolutionKind: "pending",
    }),
    true,
  );
});

test("shouldKeepExplicitChatsRoutePending returns false for a resolved not-found route", () => {
  const { shouldKeepExplicitChatsRoutePending } = AppModule as Record<string, any>;

  assert.equal(typeof shouldKeepExplicitChatsRoutePending, "function");
  assert.equal(
    shouldKeepExplicitChatsRoutePending({
      activePage: "chats",
      routeAgentId: "agent-1",
      routeThreadId: "thread-missing",
      isLoadingChatIndex: false,
      hasResolvedExactThread: false,
      routeResolutionKind: "not_found",
    }),
    false,
  );
});
