# Chat Transcript Character Threshold Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the agent chat transcript collapse heuristic with a shared `1000`-character threshold.

**Architecture:** Keep transcript item rendering in `AgentChatPage` unchanged except for the long-message detector. The detector should operate on the already-resolved transcript body text so markdown, command, and placeholder items continue to share one path. Tests should assert the threshold directly so future changes do not silently reintroduce line-based behavior.

**Tech Stack:** React, TypeScript/TSX, Node test runner, React server rendering

---

## Chunk 1: TDD And Implementation

### Task 1: Update transcript toggle tests

**Files:**
- Modify: `tests/chat/agent-chat-transcript-show-all.test.ts`

- [ ] **Step 1: Write the failing test**

Add coverage that:

- renders one transcript item with more than `1000` characters and expects one `Show all` toggle
- renders one transcript item with `1000` characters or fewer and expects no toggle
- keeps command execution coverage under the same threshold rule

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test tests/chat/agent-chat-transcript-show-all.test.ts`
Expected: FAIL because the current implementation still uses estimated wrapped lines.

- [ ] **Step 3: Write minimal implementation**

Replace the line-estimation helper in `src/pages/AgentChatPage.tsx` with a single helper that returns `true` when the normalized transcript body exceeds `1000` characters.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --test tests/chat/agent-chat-transcript-show-all.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/chat/agent-chat-transcript-show-all.test.ts src/pages/AgentChatPage.tsx docs/superpowers/specs/2026-03-13-chat-transcript-character-threshold-design.md docs/superpowers/plans/2026-03-13-chat-transcript-character-threshold.md
git commit -m "feat: use character threshold for chat transcript collapse"
```

### Task 2: Verify repo-level impact

**Files:**
- Review: `../companyhelm-common` e2e coverage if present for chat transcript expansion behavior

- [ ] **Step 1: Inspect common e2e coverage**

Run: `rg -n "Show all|chat transcript|AgentChatPage" ../companyhelm-common`
Expected: either no relevant coverage or clear evidence of tests that would need updating.

- [ ] **Step 2: Run frontend verification**

Run: `npm test -- --test tests/chat/agent-chat-transcript-show-all.test.ts`
Expected: PASS

- [ ] **Step 3: Run any broader frontend test/build command required by the repo**

Run: `npm test`
Expected: PASS, or identify unrelated failures explicitly before proceeding.
