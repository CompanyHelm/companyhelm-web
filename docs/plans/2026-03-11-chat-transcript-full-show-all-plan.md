# Chat Transcript Full Show All Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make expanded transcript items in agent chat render their full original content for any transcript item type.

**Architecture:** Keep the existing transcript item body resolution in `AgentChatPage`, but treat collapsed and expanded transcript rendering as distinct states instead of only toggling a clamp class. Expanded transcript items should render the original `bodyText` in an unclamped container, while collapsed items keep the compact inline transcript layout.

**Tech Stack:** React, TypeScript, React DOM server tests, CSS, Vite

---

## Chunk 1: Transcript Expansion Behavior

### Task 1: Add the failing transcript expansion test

**Files:**
- Modify: `tests/chat/agent-chat-transcript-show-all.test.ts`
- Modify: `src/pages/AgentChatPage.tsx` only after the failing assertion is verified

- [ ] **Step 1: Write the failing test**

Add a focused render test that exercises the transcript toggle state by:

- rendering one long transcript item with a deterministic full body string
- triggering the expanded state for that item through component props/state setup
- asserting the expanded markup no longer includes the collapsed transcript class
- asserting the full original transcript body is still rendered for the expanded item

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/chat/agent-chat-transcript-show-all.test.ts`
Expected: FAIL because expanded transcript items still rely on the collapsed transcript wrapper behavior.

- [ ] **Step 3: Write minimal implementation**

In `src/pages/AgentChatPage.tsx`:

- extract transcript body rendering so collapsed and expanded transcript states are explicit
- render expanded transcript items without the collapsed transcript class for all transcript item types
- keep the same resolved `bodyText` source for both states so `Show all` uses the original full content

In `src/index.css`:

- keep clamp styling scoped to the collapsed transcript wrapper only
- avoid any expanded-state overflow rule that still visually shortens transcript content

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/chat/agent-chat-transcript-show-all.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/chat/agent-chat-transcript-show-all.test.ts src/pages/AgentChatPage.tsx src/index.css
git commit -m "fix: show full transcript content when expanded"
```

### Task 2: Verify the frontend change

**Files:**
- Modify: none

- [ ] **Step 1: Run targeted frontend tests**

Run: `npm test -- tests/chat/agent-chat-transcript-show-all.test.ts`
Expected: PASS

- [ ] **Step 2: Run the relevant frontend verification**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Build the frontend**

Run: `npm run build`
Expected: PASS

### Task 3: Finish the branch

**Files:**
- Modify: none

- [ ] **Step 1: Review the diff**

Run: `git diff --stat`
Expected: only the planned frontend files change

- [ ] **Step 2: Rebase onto the latest main**

Run: `git fetch origin` then `git rebase origin/main`
Expected: no conflicts

- [ ] **Step 3: Push and open the PR**

Run:

```bash
git push -u origin <branch-name>
gh pr create --body-file <temp-file>
```

Expected: PR opened successfully

- [ ] **Step 4: Wait for checks**

Run: `gh pr checks --watch`
Expected: all checks pass before completion
