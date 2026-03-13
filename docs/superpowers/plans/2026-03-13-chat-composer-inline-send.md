# Chat Composer Inline Send Button Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the idle chat composer send button on the same row as the message textarea across desktop and mobile layouts.

**Architecture:** Reuse the existing composer markup and change only the idle-state CSS layout rules in `src/index.css`. Verify the behavior with a focused CSS source test so the layout contract is explicit without adding brittle browser-only assertions.

**Tech Stack:** React, TypeScript, CSS, Node test runner (`tsx --test`)

---

## Chunk 1: Test First

### Task 1: Assert idle composer layout rules

**Files:**
- Create: `tests/chat/chat-composer-layout.test.ts`

- [ ] **Step 1: Write the failing test**

Add CSS source assertions that the idle composer row uses a horizontal flex direction in the base rules and in the mobile breakpoint, and that the idle toolbar does not claim full width.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/chat/chat-composer-layout.test.ts`
Expected: FAIL because the current stylesheet still stacks the idle composer vertically and expands the toolbar to full width.

## Chunk 2: Minimal Implementation

### Task 2: Update idle composer layout styles

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Write minimal implementation**

Update the idle composer CSS so the textarea wrapper and send button stay inline on desktop and mobile while leaving the running-state rules unchanged.

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- tests/chat/chat-composer-layout.test.ts`
Expected: PASS

## Chunk 3: Verification And Delivery

### Task 3: Run focused verification and inspect shared e2e relevance

**Files:**
- Review only: `../companyhelm-common`

- [ ] **Step 1: Run focused frontend verification**

Run: `npm test -- tests/chat/chat-composer-layout.test.ts tests/chat/agent-chat-loading-state.test.ts`
Expected: PASS

- [ ] **Step 2: Check common e2e coverage relevance**

Inspect `../companyhelm-common/tests/system/07-responsive/responsive.spec.ts` and related chat journeys for selectors or assumptions that would require updates for this layout-only change.
Expected: no required e2e changes unless a test hard-codes the stacked composer layout.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-03-13-chat-composer-inline-send-design.md \
  docs/superpowers/plans/2026-03-13-chat-composer-inline-send.md \
  src/index.css \
  tests/chat/chat-composer-layout.test.ts
git commit -m "fix: align chat send button with input"
```
