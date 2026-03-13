# Chat Create Disconnected Copy Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the chat-page disconnected runner warning with the shorter copy `Disconnected` while preserving existing chat creation gating behavior.

**Architecture:** Keep the change local to the frontend chat-page helper in `src/App.tsx` and add focused render coverage in the existing chat sidebar test file. Do not touch API validation or the agent creation flow.

**Tech Stack:** React 18, TypeScript, server-side render tests with `node:test` and `react-dom/server`

---

## Chunk 1: Lock the chat-page copy change

### Task 1: Add failing regression coverage for the disconnected warning

**Files:**
- Modify: `tests/chat/agent-chat-sidebar-actions.test.ts`

- [ ] **Step 1: Write the failing test**

Add assertions that the chat sidebar renders `Disconnected` when `getCreateChatDisabledReason` returns the disconnected warning for an agent with no chats yet.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/chat/agent-chat-sidebar-actions.test.ts`
Expected: FAIL because the current test coverage does not assert the new warning copy.

### Task 2: Implement the minimal chat-page copy change

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Change the disconnected runner warning copy**

Replace the current long-form blocked reason with the exact string `Disconnected` inside the chat creation helper.

- [ ] **Step 2: Run the focused test to verify it passes**

Run: `npm test -- tests/chat/agent-chat-sidebar-actions.test.ts`
Expected: PASS

## Chunk 2: Verify impact and finish the branch

### Task 3: Confirm repo scope and publish the change

**Files:**
- Inspect: `../companyhelm-common`

- [ ] **Step 1: Re-run the focused frontend test**

Run: `npm test -- tests/chat/agent-chat-sidebar-actions.test.ts`
Expected: PASS

- [ ] **Step 2: Inspect shared e2e coverage**

Confirm `companyhelm-common` has no e2e expectations coupled to the removed long-form copy.

- [ ] **Step 3: Commit the implementation**

```bash
git add src/App.tsx tests/chat/agent-chat-sidebar-actions.test.ts docs/superpowers/specs/2026-03-13-chat-create-disconnected-copy-design.md docs/superpowers/plans/2026-03-13-chat-create-disconnected-copy.md
git commit -m "fix: shorten disconnected chat copy"
```

- [ ] **Step 4: Rebase and publish**

```bash
git fetch origin
git rebase origin/main
git push --set-upstream origin codex/chat-disconnected-copy
```

- [ ] **Step 5: Create the PR**

Create a PR against `main` with a body file summarizing:
- the chat page now shows `Disconnected` when a runner blocks new chat creation
- existing gating behavior is unchanged
- focused frontend regression coverage was updated
