# Strict Chats Route Resolution Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/chats` treat explicit `agentId` and `threadId` query params as authoritative, rendering the requested chat or a not-found state instead of silently falling back to another chat.

**Architecture:** Keep route strictness in pure navigation helpers, then have `App.tsx` consume those outcomes to preserve exact routes, resolve unloaded threads, and surface a dedicated not-found state into the existing chat page. Reuse `AgentChatPage` for rendering not-found copy so the route change stays in the chats shell instead of introducing a new page type.

**Tech Stack:** React 18, TypeScript, Vite, Node test runner (`tsx --test`)

---

## File Map

- Modify: `src/utils/chat-route-navigation.ts`
  Why: add strict explicit-route resolution helpers and stop implicit fallback when explicit params are present.
- Modify: `tests/utils/chat-route-navigation.test.ts`
  Why: lock down bare-route fallback vs explicit-route strictness.
- Modify: `src/App.tsx`
  Why: use strict route outcomes in the `/chats` effects, preserve pending exact routes, and set/clear chats not-found state.
- Modify: `src/pages/AgentChatPage.tsx`
  Why: render explicit route not-found copy even when the requested session is absent from the loaded sidebar data.
- Modify: `tests/chat/chat-route-loading-state.test.ts`
  Why: verify new App-level helper behavior for pending vs not-found explicit routes.
- Modify: `tests/chat/agent-chat-loading-state.test.ts`
  Why: verify explicit route not-found copy appears without regressing loading and empty transcript states.

## Chunk 1: Strict Route Resolution Helpers

### Task 1: Lock down strict explicit-route behavior in pure tests

**Files:**
- Test: `tests/utils/chat-route-navigation.test.ts`

- [ ] **Step 1: Write the failing tests**

Add tests for these exact cases:

```ts
assert.deepEqual(
  moduleRecord.resolveExplicitChatsRoute({
    requestedAgentId: "agent-missing",
    requestedThreadId: "",
    availableAgents: [{ id: "agent-1" }],
    sessionsByAgent: { "agent-1": [{ id: "thread-1" }] },
  }),
  {
    kind: "not_found",
    message: "Agent not found.",
    agentId: "agent-missing",
    threadId: "",
    path: "/chats?agentId=agent-missing",
  },
);
```

```ts
assert.deepEqual(
  moduleRecord.resolveExplicitChatsRoute({
    requestedAgentId: "agent-1",
    requestedThreadId: "thread-missing",
    availableAgents: [{ id: "agent-1" }],
    sessionsByAgent: { "agent-1": [{ id: "thread-1" }] },
  }).kind,
  "not_found",
);
```

```ts
assert.deepEqual(
  moduleRecord.resolveExplicitChatsRoute({
    requestedAgentId: "",
    requestedThreadId: "thread-2",
    availableAgents: [{ id: "agent-2" }],
    sessionsByAgent: { "agent-2": [{ id: "thread-2" }] },
  }).kind,
  "exact",
);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/utils/chat-route-navigation.test.ts`
Expected: FAIL because `resolveExplicitChatsRoute` does not exist yet.

- [ ] **Step 3: Implement the minimal helper changes**

In `src/utils/chat-route-navigation.ts`:

- Add a pure helper for explicit `/chats` routes, for example:

```ts
export function resolveExplicitChatsRoute({
  requestedAgentId = "",
  requestedThreadId = "",
  availableAgents = [],
  sessionsByAgent = {},
}: {
  requestedAgentId?: unknown;
  requestedThreadId?: unknown;
  availableAgents?: unknown;
  sessionsByAgent?: unknown;
} = {}) {
  // return { kind: "exact" | "pending" | "not_found", ... }
}
```

- Keep `resolveLoadedChatsRoute` responsible only for bare `/chats` fallback/default behavior.
- Use the existing `findAgentIdForChatThread` and session sorting helpers instead of duplicating agent/thread lookup logic.
- Return stable route payloads that include `agentId`, `threadId`, and `path` so `App.tsx` can consume them directly.
- Use exact not-found copy values that can be reused by `AgentChatPage`:
  - `"Agent not found."`
  - `"Chat not found."`
  - `"Chat does not belong to the selected agent."`

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/utils/chat-route-navigation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/utils/chat-route-navigation.test.ts src/utils/chat-route-navigation.ts
git commit -m "test: lock strict chats route resolution"
```

## Chunk 2: App Integration And Not-Found Rendering

### Task 2: Add failing app-level tests for explicit route handling

**Files:**
- Test: `tests/chat/chat-route-loading-state.test.ts`
- Test: `tests/chat/agent-chat-loading-state.test.ts`

- [ ] **Step 1: Write the failing tests**

In `tests/chat/chat-route-loading-state.test.ts`, add pure helper coverage for the App integration seam:

```ts
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
```

```ts
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
```

In `tests/chat/agent-chat-loading-state.test.ts`, add an explicit route not-found rendering case:

```ts
const markup = renderAgentChatPageMarkup({
  agent: { id: "agent-1", name: "Build Agent", agentSdk: "codex", model: "gpt-5" },
  session: null,
  chatSessionsByAgent: { "agent-1": [] },
  routeNotFoundMessage: "Chat not found.",
  isLoadingChat: false,
});

assert.match(markup, /Chat not found\./);
assert.doesNotMatch(markup, /No messages yet\. Start with one of these prompts\./);
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/chat/chat-route-loading-state.test.ts tests/chat/agent-chat-loading-state.test.ts`
Expected: FAIL because the new helper/prop does not exist yet.

### Task 3: Wire strict route outcomes into the app shell

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/AgentChatPage.tsx`
- Test: `tests/chat/chat-route-loading-state.test.ts`
- Test: `tests/chat/agent-chat-loading-state.test.ts`

- [ ] **Step 3: Implement the minimal app changes**

In `src/App.tsx`:

- Add a focused exported helper, for example:

```ts
export function shouldKeepExplicitChatsRoutePending({
  activePage,
  routeAgentId,
  routeThreadId,
  isLoadingChatIndex,
  hasResolvedExactThread,
  routeResolutionKind,
}: any) {
  return (
    activePage === "chats"
    && Boolean(String(routeAgentId || "").trim() || String(routeThreadId || "").trim())
    && routeResolutionKind === "pending"
    && !hasResolvedExactThread
    && Boolean(isLoadingChatIndex)
  );
}
```

- Add a small `/chats` route-resolution state object, for example `chatRouteResolution`, with:
  - `kind`
  - `message`
  - `agentId`
  - `threadId`
- In the route-normalization effect:
  - keep existing fallback logic only when both route params are empty
  - call `resolveExplicitChatsRoute` when either `agentId` or `threadId` is present
  - never redirect an invalid explicit route to another agent or thread
  - when the explicit route is pending, keep the exact URL active while `loadCompanyApiThread` resolves it
- In the existing thread lookup effect:
  - on successful lookup, upsert the exact thread and clear not-found state
  - on definitive failure for an explicit route, set `chatRouteResolution.kind = "not_found"` instead of redirecting to `/agents`

In `src/pages/AgentChatPage.tsx`:

- Add a focused prop such as `routeNotFoundMessage?: string`.
- Render that message as the highest-priority empty hint when present.
- Keep existing archived/pending/loading/transcript behavior unchanged.
- Prevent starter prompts from showing when the page is in explicit route not-found mode.

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `npm test -- tests/utils/chat-route-navigation.test.ts tests/chat/chat-route-loading-state.test.ts tests/chat/agent-chat-loading-state.test.ts`
Expected: PASS

- [ ] **Step 5: Run the adjacent regression tests**

Run: `npm test -- tests/chat/agent-chat-sidebar-actions.test.ts tests/chat/agent-chats-page-actions.test.ts`
Expected: PASS

- [ ] **Step 6: Manually verify the `/chats` behavior locally**

Run:

```bash
npm install
npm run dev
```

Verify:

1. Bare `/chats` still opens the default chat flow.
2. `/chats?agentId=<valid>&threadId=<valid>` stays on the exact chat.
3. Creating a new chat from `/chats` lands on the created thread instead of the first older thread.
4. `/chats?agentId=<missing>` shows `Agent not found.`
5. `/chats?agentId=<valid>&threadId=<missing>` shows `Chat not found.`

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/pages/AgentChatPage.tsx tests/chat/chat-route-loading-state.test.ts tests/chat/agent-chat-loading-state.test.ts
git commit -m "feat: make chats route resolution strict"
```

## Chunk 3: Final Verification

### Task 4: Confirm repo-level verification and integration impact

**Files:**
- Check: `package.json`
- Check: `../companyhelm-common`

- [ ] **Step 1: Run the repo test bundle most relevant to the change**

Run:

```bash
npm test -- tests/utils/chat-route-navigation.test.ts tests/chat/chat-route-loading-state.test.ts tests/chat/agent-chat-loading-state.test.ts tests/chat/agent-chat-sidebar-actions.test.ts tests/chat/agent-chats-page-actions.test.ts
```

Expected: PASS

- [ ] **Step 2: Check whether shared e2e coverage needs updates**

Run:

```bash
rg -n "chats|thread|new chat" ../companyhelm-common
```

Expected: identify whether there is any existing e2e coverage for strict `/chats` routing. If none exists, document that no shared e2e update was required.

- [ ] **Step 3: Record final status and prepare branch handoff**

```bash
git status --short
git log --oneline -n 5
```

Expected: only intended files changed, with the plan commits visible in history.
