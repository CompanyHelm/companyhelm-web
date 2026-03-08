# Chat Transcript Show All Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an inline `Show all` / `Show less` toggle for long transcript items in agent chat so the transcript stays compact by default without hiding full message content.

**Architecture:** Keep the transcript row structure in `AgentChatPage` and add a small per-item expansion state keyed by transcript item id. Detect long transcript items from the already-resolved body text, apply a shared collapsed-content class in CSS, and render a small inline toggle button only when the item crosses the length threshold.

**Tech Stack:** React, TypeScript, React Testing Library, Vite, CSS

---

### Task 1: Add the failing transcript expansion test

**Files:**
- Modify: `tests/chat/agent-chat-loading-state.test.ts` or create a focused transcript test if that keeps the fixture smaller
- Modify: `src/pages/AgentChatPage.tsx` only after the failing assertion is verified

**Step 1: Write the failing test**

Add a render test that mounts `AgentChatPage` with:

- one long transcript item that should be collapsible
- one short transcript item that should not render the toggle

Assert that:

- `Show all` is visible for the long transcript item
- `Show all` is absent for the short transcript item
- clicking `Show all` changes the control to `Show less`
- clicking `Show less` restores `Show all`

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/chat/agent-chat-loading-state.test.ts`

Expected: FAIL because transcript items do not yet render the toggle.

**Step 3: Commit**

```bash
git add tests/chat/agent-chat-loading-state.test.ts
git commit -m "test: cover transcript show all toggle"
```

### Task 2: Implement the inline transcript toggle

**Files:**
- Modify: `src/pages/AgentChatPage.tsx`
- Modify: `src/index.css`

**Step 1: Write minimal implementation**

In `src/pages/AgentChatPage.tsx`:

- add a constant threshold for long transcript content
- track expanded transcript item ids in component state
- reset expansion state when the selected session changes
- compute whether each transcript item is long after resolving `bodyText`
- apply a collapsed class when the item is long and not expanded
- render the inline `Show all` / `Show less` button for long transcript items only

In `src/index.css`:

- add a collapsed transcript content class using a multi-line clamp
- add toggle button styles consistent with existing chat inline action buttons

**Step 2: Run test to verify it passes**

Run: `npm test -- tests/chat/agent-chat-loading-state.test.ts`

Expected: PASS

**Step 3: Commit**

```bash
git add src/pages/AgentChatPage.tsx src/index.css tests/chat/agent-chat-loading-state.test.ts
git commit -m "feat: add transcript show all toggle"
```

### Task 3: Verify the frontend change

**Files:**
- Modify: none

**Step 1: Run targeted tests**

Run: `npm test -- tests/chat/agent-chat-loading-state.test.ts`

Expected: PASS

**Step 2: Run the frontend test suite**

Run: `npm test`

Expected: PASS

**Step 3: Build the frontend**

Run: `npm run build`

Expected: PASS

**Step 4: Boot the frontend locally**

Run: `npm run dev`

Expected: the dev server starts without runtime errors

### Task 4: Finish the branch

**Files:**
- Modify: none

**Step 1: Review the diff**

Run: `git diff --stat` and inspect the final changes.

**Step 2: Rebase onto the latest main**

Run: `git fetch origin` then `git rebase origin/main`

Expected: no conflicts

**Step 3: Push and open the PR**

Run:

```bash
git push -u origin <branch-name>
gh pr create --body-file <temp-file>
```

Expected: PR opened successfully

**Step 4: Wait for checks**

Run: `gh pr checks --watch`

Expected: all checks pass before completion
