# Archived Tab Thread Creation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove thread creation affordances from the archived chats tab so users cannot start a new thread from archived chat views.

**Architecture:** Keep the change local to the two page components that render chat creation controls. Use the existing normalized chat list status filter to gate `New chat` and chat-settings UI in archived mode, and verify behavior with focused render tests before changing production code.

**Tech Stack:** React, TypeScript, node:test, react-dom/server, Vite

---

## Chunk 1: Test the archived-tab restriction

### Task 1: Cover `AgentChatPage` archived mode

**Files:**
- Modify: `tests/chat/agent-chat-sidebar-actions.test.ts`
- Modify: `src/pages/AgentChatPage.tsx` only after the failing assertion is verified

- [ ] **Step 1: Write the failing test**

Add a render assertion for archived mode that proves `AgentChatPage` does not render any `aria-label="New chat"` button when `chatListStatusFilter` is `archived`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/chat/agent-chat-sidebar-actions.test.ts`
Expected: FAIL because archived mode still renders create buttons.

- [ ] **Step 3: Commit**

```bash
git add tests/chat/agent-chat-sidebar-actions.test.ts
git commit -m "test: cover archived chat create actions"
```

### Task 2: Cover `AgentChatsPage` archived mode

**Files:**
- Create: `tests/chat/agent-chats-page-actions.test.ts`
- Modify: `src/pages/AgentChatsPage.tsx` only after the failing assertion is verified

- [ ] **Step 1: Write the failing test**

Add a focused render test that mounts `AgentChatsPage` with `chatListStatusFilter: "archived"` and asserts the toolbar does not contain `New chat` or the chat settings action.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/chat/agent-chats-page-actions.test.ts`
Expected: FAIL because archived mode still renders the creation toolbar.

- [ ] **Step 3: Commit**

```bash
git add tests/chat/agent-chats-page-actions.test.ts
git commit -m "test: cover archived agent chats toolbar"
```

## Chunk 2: Hide creation controls in archived mode

### Task 3: Gate `AgentChatPage` create actions

**Files:**
- Modify: `src/pages/AgentChatPage.tsx`
- Test: `tests/chat/agent-chat-sidebar-actions.test.ts`

- [ ] **Step 1: Write minimal implementation**

Use the existing normalized list filter to compute a `canShowCreateChatActions` boolean and wrap all `New chat` button render branches with it.

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- tests/chat/agent-chat-sidebar-actions.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/pages/AgentChatPage.tsx tests/chat/agent-chat-sidebar-actions.test.ts
git commit -m "fix: hide new chat actions in archived tab"
```

### Task 4: Gate `AgentChatsPage` create actions

**Files:**
- Modify: `src/pages/AgentChatsPage.tsx`
- Test: `tests/chat/agent-chats-page-actions.test.ts`

- [ ] **Step 1: Write minimal implementation**

Hide the toolbar `New chat` button and chat settings button whenever the normalized list filter is `archived`.

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- tests/chat/agent-chats-page-actions.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/pages/AgentChatsPage.tsx tests/chat/agent-chats-page-actions.test.ts
git commit -m "fix: hide archived toolbar create actions"
```

## Chunk 3: Verify, ship, and open the PR

### Task 5: Verify the frontend change

**Files:**
- Modify: none

- [ ] **Step 1: Run focused chat tests**

Run: `npm test -- tests/chat/agent-chat-sidebar-actions.test.ts tests/chat/agent-chats-page-actions.test.ts`
Expected: PASS

- [ ] **Step 2: Run the frontend test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Build the frontend**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Boot the frontend locally**

Run: `npm run dev`
Expected: the dev server starts without runtime errors

### Task 6: Finish the branch

**Files:**
- Modify: none

- [ ] **Step 1: Review the diff**

Run: `git diff --stat`

- [ ] **Step 2: Rebase onto the latest main**

Run: `git fetch origin` then `git rebase origin/main`
Expected: no conflicts

- [ ] **Step 3: Push and open the PR**

Run:

```bash
git push -u origin <branch-name>
gh pr create --body-file <path-to-body-file>
```

Expected: PR opened successfully.

- [ ] **Step 4: Wait for checks**

Run: `gh pr checks --watch`
Expected: all checks pass before completion.
