# Chat Status Badges Right Of Title Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render chat session status badges to the right of chat titles in both the agent chat sidebar and chats overview list.

**Architecture:** Keep the existing chat-card structures and badge classes, but move the badge markup into a shared inline title row inside each card body. Adjust CSS only where needed to preserve truncation and spacing, then verify behavior with focused server-rendered markup tests.

**Tech Stack:** React, TypeScript, CSS, Node test runner (`tsx --test`)

---

## Chunk 1: Test First

### Task 1: Assert title-before-status order in both chat lists

**Files:**
- Modify: `tests/chat/agent-chat-sidebar-actions.test.ts`
- Modify: `tests/chat/chats-overview-page-actions.test.ts`

- [ ] **Step 1: Write the failing tests**

Add assertions that each rendered row places the title text before the status badge markup for representative `error`, `pending`, and `archived` sessions.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/chat/agent-chat-sidebar-actions.test.ts tests/chat/chats-overview-page-actions.test.ts`
Expected: FAIL because the status badges still render before the title.

## Chunk 2: Minimal Implementation

### Task 2: Move badges into the title row

**Files:**
- Modify: `src/pages/AgentChatPage.tsx`
- Modify: `src/pages/ChatsOverviewPage.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write minimal implementation**

Move the badge container into the title row in both page components and add the minimal CSS required for inline title/status layout and title truncation.

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- tests/chat/agent-chat-sidebar-actions.test.ts tests/chat/chats-overview-page-actions.test.ts`
Expected: PASS

## Chunk 3: Verification And Delivery

### Task 3: Run focused verification and inspect shared e2e relevance

**Files:**
- Review only: `../companyhelm-common`

- [ ] **Step 1: Run focused frontend verification**

Run: `npm test -- tests/chat/agent-chat-sidebar-actions.test.ts tests/chat/chats-overview-page-actions.test.ts tests/chat/agent-chat-loading-state.test.ts`
Expected: PASS

- [ ] **Step 2: Check common e2e coverage relevance**

Inspect `../companyhelm-common` for e2e coverage that would need updates for this UI-only badge position change.
Expected: no required e2e changes unless brittle text-order assertions exist.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-03-13-chat-status-badges-right-design.md \
  docs/superpowers/plans/2026-03-13-chat-status-badges-right.md \
  src/pages/AgentChatPage.tsx \
  src/pages/ChatsOverviewPage.tsx \
  src/index.css \
  tests/chat/agent-chat-sidebar-actions.test.ts \
  tests/chat/chats-overview-page-actions.test.ts
git commit -m "fix: move chat status badges beside titles"
```
