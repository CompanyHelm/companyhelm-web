# Chat Transcript Wrapped Line Threshold Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the wrapped-line transcript collapse heuristic and raise the collapse threshold from `8` to `30` wrapped lines.

**Architecture:** Keep transcript item rendering in `AgentChatPage` unchanged except for the long-message detector. The detector should revert to the original wrapped-line estimate using `72` characters per line, with only the collapse threshold changing to `30`. Tests should assert the wrapped-line behavior directly so future changes do not silently reintroduce the temporary character-count rule.

**Tech Stack:** React, TypeScript/TSX, Node test runner, React server rendering

---

## Chunk 1: TDD And Implementation

### Task 1: Update transcript toggle tests

**Files:**
- Modify: `tests/chat/agent-chat-transcript-show-all.test.ts`

- [ ] **Step 1: Write the failing test**

Add coverage that:

- renders one transcript item with `31` short newline-separated lines and expects one `Show all` toggle
- renders one transcript item with `30` short newline-separated lines and expects no toggle
- keeps command execution coverage under the same wrapped-line threshold rule

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test tests/chat/agent-chat-transcript-show-all.test.ts`
Expected: FAIL because the current implementation still uses a `1000`-character threshold.

- [ ] **Step 3: Write minimal implementation**

Restore the wrapped-line helper from the old transcript toggle implementation and set the collapse threshold constant to `30`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --test tests/chat/agent-chat-transcript-show-all.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/chat/agent-chat-transcript-show-all.test.ts src/pages/AgentChatPage.tsx docs/superpowers/specs/2026-03-13-chat-transcript-character-threshold-design.md docs/superpowers/plans/2026-03-13-chat-transcript-character-threshold.md
git commit -m "fix: restore wrapped-line transcript collapse threshold"
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
