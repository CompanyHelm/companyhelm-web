# GitHub Install Repos Redirect Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route GitHub installation callbacks back to the repos page instead of the settings page.

**Architecture:** Update the callback redirect target in the GitHub install flow and in the callback cleanup utility so both steps resolve to `/repos`. Verify the behavior with a focused utility test and the frontend test suite.

**Tech Stack:** React, TypeScript, Node test runner (`tsx --test`)

---

### Task 1: Cover the callback cleanup redirect

**Files:**
- Modify: `tests/utils/path.test.ts`
- Test: `tests/utils/path.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test that seeds `window.location` with the GitHub callback URL, calls `clearGithubInstallCallbackFromLocation()`, and expects the browser pathname to become `/repos`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/utils/path.test.ts`
Expected: FAIL because the helper currently replaces the URL with `/settings`.

- [ ] **Step 3: Write minimal implementation**

Update `src/utils/path.ts` so `clearGithubInstallCallbackFromLocation()` replaces the callback URL with `/repos`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/utils/path.test.ts`
Expected: PASS.

### Task 2: Align the install callback flow

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/utils/path.ts`
- Test: `tests/utils/path.test.ts`

- [ ] **Step 1: Update the redirect target**

Change the GitHub install callback effect in `src/App.tsx` to call `navigateTo("repos")` instead of `navigateTo("settings")`.

- [ ] **Step 2: Run focused verification**

Run: `npm test -- tests/utils/path.test.ts`
Expected: PASS.

- [ ] **Step 3: Run full frontend verification**

Run: `npm test`
Expected: PASS with no new failures.

- [ ] **Step 4: Commit**

Commit with a focused message after verification succeeds.
