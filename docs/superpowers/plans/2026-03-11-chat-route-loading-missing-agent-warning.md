# Chat Route Loading Missing-Agent Warning Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Suppress the transient `Agent <id> was not found for this company.` warning on the chats page while the chats bootstrap payload is still loading, but keep the warning once loading has completed and the agent is actually missing.

**Architecture:** Keep the change in `App.tsx` by computing a chats-route-specific guard for the props passed into `AgentChatPage`. Add a focused regression test for the guard first, verify it fails, then use that guard to blank the disabled-reason props only during the loading window.

**Tech Stack:** React, TypeScript, node:test, Vite

---

## Chunk 1: Cover the transient loading case

### Task 1: Add a regression test for chats-route prop gating

**Files:**
- Create: none
- Modify: `tests/chat/chat-route-loading-state.test.ts`
- Modify: `src/App.tsx` only after the failing assertion is verified

- [ ] **Step 1: Write the failing test**

Add a focused test for a pure helper exported from `src/App.tsx` that returns `true` only when the chats route is still loading and the route agent has not yet been resolved in the company agent list.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/chat/chat-route-loading-state.test.ts`
Expected: FAIL because the helper does not exist yet.

## Chunk 2: Gate the chats-route props

### Task 2: Implement the minimal `App.tsx` change

**Files:**
- Modify: `src/App.tsx`
- Test: `tests/chat/chat-route-loading-state.test.ts`

- [ ] **Step 1: Write the minimal implementation**

Export a pure helper that detects the transient unresolved chats-route state, then use it to pass empty `sendDisabledReason` and `getCreateChatDisabledReason` props into `AgentChatPage` on the `/chats` route while bootstrap is still in flight.

- [ ] **Step 2: Run the focused test to verify it passes**

Run: `npm test -- tests/chat/chat-route-loading-state.test.ts`
Expected: PASS

## Chunk 3: Verify and ship

### Task 3: Verify the frontend-only regression fix

**Files:**
- Modify: none

- [ ] **Step 1: Run related chat tests**

Run: `npm test -- tests/chat/chat-route-loading-state.test.ts tests/chat/agent-chat-loading-state.test.ts tests/chat/agent-chat-sidebar-actions.test.ts`
Expected: PASS

- [ ] **Step 2: Run the frontend test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Build the frontend**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Inspect shared e2e coverage and ship**

Run: `rg -n "chats|chat" /workspace/companyhelm-common`, `git fetch origin`, `git rebase origin/main`, `git push -u origin <branch>`, `gh pr create --body-file <path>`, `gh pr checks --watch`
Expected: No required common-repo e2e changes, PR opens, and checks pass.
