# Chats Overview Archived Create Actions Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide all `New chat` creation affordances on the chats overview when the archived filter is selected.

**Architecture:** Keep the change local to `ChatsOverviewPage` and drive it from the existing chat list status filter instead of adding new state. Add a render test first, verify it fails, then gate the per-agent creation cards behind the normalized archived/active status.

**Tech Stack:** React, TypeScript, node:test, react-dom/server, Vite

---

## Chunk 1: Test the archived overview behavior

### Task 1: Cover `ChatsOverviewPage` archived mode

**Files:**
- Create: `tests/chat/chats-overview-page-actions.test.ts`
- Modify: `src/pages/ChatsOverviewPage.tsx` only after the failing assertion is verified

- [ ] **Step 1: Write the failing test**

Render `ChatsOverviewPage` with `chatListStatusFilter: "archived"` and assert the markup does not contain `New chat`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/chat/chats-overview-page-actions.test.ts`
Expected: FAIL because archived mode still renders the create card.

## Chunk 2: Hide the create cards

### Task 2: Gate `ChatsOverviewPage` create actions

**Files:**
- Modify: `src/pages/ChatsOverviewPage.tsx`
- Test: `tests/chat/chats-overview-page-actions.test.ts`

- [ ] **Step 1: Write the minimal implementation**

Normalize the list filter, compute a `canShowCreateChatActions` boolean, and only render the per-agent create card when the filter is not `archived`.

- [ ] **Step 2: Run the focused test to verify it passes**

Run: `npm test -- tests/chat/chats-overview-page-actions.test.ts`
Expected: PASS

## Chunk 3: Verify and ship

### Task 3: Verify the frontend change

**Files:**
- Modify: none

- [ ] **Step 1: Run focused chat tests**

Run: `npm test -- tests/chat/chats-overview-page-actions.test.ts tests/chat/agent-chat-sidebar-actions.test.ts tests/chat/agent-chats-page-actions.test.ts`
Expected: PASS

- [ ] **Step 2: Run the frontend test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Build the frontend**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Rebase, push, open PR, and watch checks**

Run: `git fetch origin`, `git rebase origin/main`, `git push -u origin <branch>`, `gh pr create --body-file <path>`, `gh pr checks --watch`
Expected: PR opens and checks pass.
