# Mobile Chat Solid Background Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore solid mobile backgrounds for the chat settings modal and chat list surfaces without changing desktop chat behavior.

**Architecture:** Keep the change inside the existing chat page styling path. First lock the intended mobile surface behavior with a focused regression test, then add the smallest CSS and component-class change needed so the mobile chat list panels and chat settings modal opt out of the transparent mobile panel reset.

**Tech Stack:** React, TypeScript, CSS, Vite, Node test runner (`npm test`)

---

## Chunk 1: Lock the mobile settings surface behavior

### Task 1: Add regression coverage for the mobile chat settings surface

**Files:**
- Modify: `tests/chat/agent-chat-sidebar-actions.test.ts`
- Modify: `src/pages/AgentChatPage.tsx`

- [ ] **Step 1: Write the failing test**

Add a mobile viewport rendering test for `AgentChatPage` that opens the chat settings modal and asserts the modal uses a chat-specific surface class instead of relying only on the generic modal card class.

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm test -- tests/chat/agent-chat-sidebar-actions.test.ts`
Expected: FAIL because the settings modal does not yet expose a dedicated class for the mobile solid background override

## Chunk 2: Implement the targeted mobile background override

### Task 2: Apply the minimal component and CSS changes

**Files:**
- Modify: `src/pages/AgentChatPage.tsx`
- Modify: `src/index.css`
- Modify: `tests/chat/agent-chat-sidebar-actions.test.ts`

- [ ] **Step 1: Write the minimal implementation**

Update the chat settings modal to include a dedicated card class and add a mobile CSS override that restores a solid background for:
- `.chat-sidebar-panel-mobile-full`
- `.chat-sidebar-panel-mobile-overlay`
- the dedicated chat settings modal card class

Keep the broad mobile transparent panel reset for other chat layout surfaces.

- [ ] **Step 2: Run the targeted test to verify it passes**

Run: `npm test -- tests/chat/agent-chat-sidebar-actions.test.ts`
Expected: PASS

- [ ] **Step 3: Run broader frontend verification**

Run: `npm test -- tests/chat/agent-chat-page-actions.test.ts tests/chat/agent-chat-sidebar-actions.test.ts`
Expected: PASS

## Chunk 3: Validate integration and prepare PR

### Task 3: Verify repo impact and publish the change

**Files:**
- Modify: none expected unless verification surfaces issues

- [ ] **Step 1: Check whether shared e2e coverage needs updates**

Inspect `companyhelm-common` for e2e coverage around mobile chat settings or chat sidebar presentation.
Expected: no e2e update needed for a frontend-only surface-style fix, but confirm explicitly

- [ ] **Step 2: Run frontend build verification**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Sync with latest main**

Run: `git fetch origin && git rebase origin/main`
Expected: rebase completes without conflicts

- [ ] **Step 4: Create the commit**

Run:
```bash
git add src/pages/AgentChatPage.tsx src/index.css tests/chat/agent-chat-sidebar-actions.test.ts docs/superpowers/specs/2026-03-11-mobile-chat-solid-background-design.md docs/superpowers/plans/2026-03-11-mobile-chat-solid-background.md
git commit -m "fix: restore solid mobile chat backgrounds"
```

- [ ] **Step 5: Push and open PR**

Run:
```bash
git push -u origin <branch-name>
gh pr create --title "fix: restore solid mobile chat backgrounds" --body-file <prepared-body-file>
```

- [ ] **Step 6: Wait for checks**

Run: `gh pr checks <pr-number> --watch`
Expected: all checks pass before reporting completion
