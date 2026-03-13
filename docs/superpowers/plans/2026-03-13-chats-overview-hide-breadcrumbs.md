# Chats Overview Breadcrumb Removal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the redundant breadcrumb panel from the `/chats` overview so the shell page title is the only page heading.

**Architecture:** `App.tsx` already computes route-aware breadcrumbs and the mobile shell title from the same route state. The fix should suppress `Breadcrumbs` only for the chats overview route, leaving agent and thread chat routes unchanged, and protect that behavior with a focused app-level test.

**Tech Stack:** React 18, TypeScript, Vite, Node test runner

---

### Task 1: Add a failing regression test for the chats overview route

**Files:**
- Create: `tests/chat/chats-overview-breadcrumbs.test.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the failing test**

Add a source-level test that reads `src/App.tsx` and asserts the chats overview route has a dedicated condition that suppresses the breadcrumb render while other chat routes keep using `Breadcrumbs`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/chat/chats-overview-breadcrumbs.test.ts`
Expected: FAIL because `App.tsx` currently renders `Breadcrumbs` unconditionally for the chats overview route.

- [ ] **Step 3: Write minimal implementation**

Introduce a small boolean for the chats overview route and gate the `Breadcrumbs` render with it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/chat/chats-overview-breadcrumbs.test.ts`
Expected: PASS

- [ ] **Step 5: Run related breadcrumb and chats tests**

Run: `npm test -- tests/chat/chats-overview-breadcrumbs.test.ts tests/chat/chat-breadcrumb-visibility.test.ts tests/chat/chats-overview-page-actions.test.ts`
Expected: PASS

- [ ] **Step 6: Run repo verification**

Run: `npm test`
Expected: PASS
