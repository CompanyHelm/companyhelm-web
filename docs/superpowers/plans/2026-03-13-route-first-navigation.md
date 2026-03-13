# Route-First Navigation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make route clicks update the URL immediately and let the destination page own loading state, with no pre-navigation GraphQL wait on chats or task-thread deep links.

**Architecture:** Keep `App.tsx` as the top-level route owner, but extract the chat-route decision logic into a focused utility module so click-time path generation and post-navigation reconciliation stay testable. Update chat entry points to push `/chats` immediately, then let route effects resolve agent/thread selection, auto-open behavior, and fallbacks after the route is active.

**Tech Stack:** React, TypeScript, Vite, node:test, tsx

---

## Chunk 1: Route-First Chat Navigation Utilities

### Task 1: Add failing coverage for chat-route path generation and post-load reconciliation

**Files:**
- Create: `tests/utils/chat-route-navigation.test.ts`
- Create: `src/utils/chat-route-navigation.ts`

- [ ] **Step 1: Write the failing utility tests**

Cover these focused cases in `tests/utils/chat-route-navigation.test.ts`:
- building an immediate chats path for a plain chats click returns `/chats`
- building an immediate chats path for a known agent/thread returns `/chats?agentId=...&threadId=...`
- building an immediate chats path for a thread-only deep link returns `/chats?threadId=...`
- post-load reconciliation keeps compact mode on the list route instead of auto-opening a thread
- post-load reconciliation auto-opens the first thread on wide layouts when the route has no thread
- post-load reconciliation falls back to `/agents` when no route agent can be resolved after loading

Example target shape:

```ts
assert.equal(
  buildImmediateChatsPath({ threadId: "thread-1" }),
  "/chats?threadId=thread-1",
);
```

- [ ] **Step 2: Run the new utility test file and verify it fails**

Run:

```bash
npm test -- tests/utils/chat-route-navigation.test.ts
```

Expected: FAIL because `src/utils/chat-route-navigation.ts` does not exist yet.

- [ ] **Step 3: Implement the minimal utility module**

Create `src/utils/chat-route-navigation.ts` with pure helpers for:
- immediate chats-path generation
- locating a thread inside a `sessionsByAgent` snapshot
- resolving the post-load chats route target once agents and session lists are known

Keep the module narrowly scoped to route navigation decisions. Do not move data fetching into it.

- [ ] **Step 4: Run the utility test file again**

Run:

```bash
npm test -- tests/utils/chat-route-navigation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the utility layer**

```bash
git add tests/utils/chat-route-navigation.test.ts src/utils/chat-route-navigation.ts
git commit -m "feat: add chat route navigation helpers"
```

## Chunk 2: App Integration For Immediate Route Updates

### Task 2: Replace pre-navigation waits in chats entry points

**Files:**
- Modify: `src/App.tsx`
- Test: `tests/utils/chat-route-navigation.test.ts`
- Modify: `tests/chat/chat-route-loading-state.test.ts`

- [ ] **Step 1: Add failing regression coverage for route-first chats behavior**

Extend `tests/chat/chat-route-loading-state.test.ts` with focused assertions for the pure helpers or exported guards that describe:
- chats route warnings stay suppressed while route reconciliation is still loading
- thread-only chats routes can stay active while the app resolves the owning agent

- [ ] **Step 2: Run the focused chat tests and verify the new assertions fail**

Run:

```bash
npm test -- tests/chat/chat-route-loading-state.test.ts tests/utils/chat-route-navigation.test.ts
```

Expected: FAIL because `App.tsx` still waits on bootstrap before certain chats navigations settle.

- [ ] **Step 3: Implement route-first navigation in `App.tsx`**

Update `src/App.tsx` to:
- replace `navigateTo("chats")` pre-navigation waiting with an immediate `setBrowserPath(...)`
- make `handleOpenTaskThread` navigate immediately to `/chats?threadId=<id>` instead of awaiting bootstrap lookups first
- move agent/thread resolution, compact-vs-desktop auto-open behavior, and `/agents` or `/settings` fallbacks into route-time reconciliation effects
- clear stale chat session and transcript state on route changes so destination loaders render instead of previous-chat content

Keep existing page loaders and existing data-fetch calls. The change is about timing and ownership, not new loading UI.

- [ ] **Step 4: Run the focused chat tests again**

Run:

```bash
npm test -- tests/chat/chat-route-loading-state.test.ts tests/chat/agent-chat-loading-state.test.ts tests/utils/chat-route-navigation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the app integration changes**

```bash
git add src/App.tsx tests/chat/chat-route-loading-state.test.ts tests/chat/agent-chat-loading-state.test.ts tests/utils/chat-route-navigation.test.ts
git commit -m "feat: make chat navigation route-first"
```

## Chunk 3: Verification And Shared-Test Audit

### Task 3: Verify the frontend behavior and inspect common e2e expectations

**Files:**
- Review: `../companyhelm-common/tests/system/01-app-load-navigation/app-load-navigation.spec.ts`
- Review: `../companyhelm-common/tests/system/03-agent-chats/agent-chats.spec.ts`
- Modify: only if the shared tests rely on the old blocking timing

- [ ] **Step 1: Run the route-related frontend tests**

Run:

```bash
npm test -- tests/chat/*.test.ts tests/components/tasks-page.test.ts tests/utils/chat-route-navigation.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the full frontend test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 3: Build the frontend**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Review shared e2e coverage**

Run:

```bash
rg -n "Chats|chat|navigate" /workspace/companyhelm-common/tests/system
```

Expected: confirm whether the shared tests assert only eventual page readiness or whether any timing assumptions need updates.

- [ ] **Step 5: Rebase, push, and open the PR**

Run:

```bash
git fetch origin
git rebase origin/main
git push -u origin <branch>
gh pr create --body-file <path>
gh pr checks --watch
```

Expected: branch rebases cleanly, PR opens, and checks pass.
