# Overview Archiving Badge Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show an `archiving` badge in the chats overview list while a thread archive operation is in flight.

**Architecture:** Keep the change local to `ChatsOverviewPage` and its focused render tests. Reuse the existing per-row status resolution pattern already present in `AgentChatsPage` and `AgentChatPage`, adding only the missing optional prop and badge branch.

**Tech Stack:** React 18, TypeScript, server-side render tests with `node:test` and `react-dom/server`

---

## Chunk 1: Add regression coverage first

### Task 1: Extend overview page render tests for archiving

**Files:**
- Modify: `tests/chat/chats-overview-page-actions.test.ts`

- [ ] **Step 1: Write the failing test**

Add assertions that:
- a chat session with `status: "archiving"` renders an `archiving` badge in the overview markup
- a chat session with a matching `archivingChatSessionKey` also renders an `archiving` badge

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/chat/chats-overview-page-actions.test.ts`
Expected: FAIL because `ChatsOverviewPage` does not yet render `archiving`, even when the new prop is supplied by the test helper.

### Task 2: Implement the minimal overview badge change

**Files:**
- Modify: `src/pages/ChatsOverviewPage.tsx`

- [ ] **Step 1: Add the transient archive key prop**

Add `archivingChatSessionKey` to the `ChatsOverviewPage` props so callers can reflect local in-flight archive work.

- [ ] **Step 2: Render the missing badge branch**

Compute `isArchivingSession` and `isArchivingChat` for each overview row and render the `archiving` badge when the row is not running.

- [ ] **Step 3: Run the focused test to verify it passes**

Run: `npm test -- tests/chat/chats-overview-page-actions.test.ts`
Expected: PASS

## Chunk 2: Verify adjacent impact and finish branch

### Task 3: Run relevant verification and inspect e2e impact

**Files:**
- Inspect: `../companyhelm-common/tests/system/03-agent-chats/agent-chats.spec.ts`

- [ ] **Step 1: Run the focused frontend test**

Run: `npm test -- tests/chat/chats-overview-page-actions.test.ts`
Expected: PASS

- [ ] **Step 2: Confirm shared e2e coverage does not need an update**

Inspect the shared system tests and confirm they do not assert the overview list archiving badge.

- [ ] **Step 3: Commit the implementation**

```bash
git add src/pages/ChatsOverviewPage.tsx tests/chat/chats-overview-page-actions.test.ts docs/superpowers/specs/2026-03-13-overview-archiving-badge-design.md docs/superpowers/plans/2026-03-13-overview-archiving-badge.md
git commit -m "fix: show archiving state in chats overview"
```

- [ ] **Step 4: Rebase and publish**

```bash
git fetch origin
git rebase origin/main
git push --set-upstream origin codex/overview-archiving-badge
```

- [ ] **Step 5: Create the PR**

Create a PR against `main` with a body file summarizing:
- the chats overview list now renders `archiving`
- the change reuses the same status rules as the existing agent-specific chat views
- focused render coverage was added for both persisted and local in-flight archiving
