# Chats Breadcrumb Visibility Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the breadcrumb header visible when `/chats` navigates from the overview into an active thread.

**Architecture:** The breadcrumb is already rendered by `App.tsx`; the regression comes from chat-layout CSS that hides `.breadcrumb-panel` when a thread is selected. The fix should be a minimal stylesheet change protected by a source-level regression test.

**Tech Stack:** React 18, TypeScript, Vite, Node test runner

---

### Task 1: Lock the regression with a test

**Files:**
- Create: `tests/chat/chat-breadcrumb-visibility.test.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing test**

Add a source-level test that reads `src/index.css` and asserts the chat layout does not contain rules that hide `.breadcrumb-panel`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/chat/chat-breadcrumb-visibility.test.ts`
Expected: FAIL because the stylesheet currently contains `.page-shell-chat-layout .breadcrumb-panel { display: none; }`.

- [ ] **Step 3: Write minimal implementation**

Remove the chat-layout rules that set `.breadcrumb-panel` to `display: none`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/chat/chat-breadcrumb-visibility.test.ts`
Expected: PASS

- [ ] **Step 5: Run related chat tests**

Run: `npm test -- tests/chat/agent-chat-page-actions.test.ts tests/chat/chat-route-loading-state.test.ts`
Expected: PASS

- [ ] **Step 6: Check repo-level verification**

Run: `npm test`
Expected: PASS
