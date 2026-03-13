# Runner Selector Labels Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show runner names instead of runner IDs in agent assignment selectors and keep not-ready runners visible but disabled.

**Architecture:** Reuse the existing shared runner formatting helper as the single source of truth for runner option labels, then align the onboarding page to that helper. Preserve the existing readiness predicate so behavioral gating stays consistent while only the displayed labels change.

**Tech Stack:** React, TypeScript, Vite, Node test runner (`tsx --test`)

---

## Chunk 1: Tests First

### Task 1: Pin shared runner label formatting

**Files:**
- Modify: `tests/utils/formatting.test.ts`
- Modify: `src/utils/formatting.ts`

- [ ] **Step 1: Write the failing test**

Add a test asserting `formatRunnerLabel({ id: "runner-1", name: "Runner One", isConnected: false })` returns `"Runner One"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/utils/formatting.test.ts`
Expected: FAIL because the helper still returns an ID-based label.

- [ ] **Step 3: Write minimal implementation**

Update `formatRunnerLabel` to return `runner.name`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/utils/formatting.test.ts`
Expected: PASS

## Chunk 2: Selector Rendering

### Task 2: Pin create modal runner option labels

**Files:**
- Modify: `tests/components/agent-create-modal.test.ts`
- Modify: `src/components/AgentCreateModal.tsx`

- [ ] **Step 1: Write the failing test**

Add a test that renders the create modal with one ready runner and one not-ready runner and asserts:

- the option text contains the runner names
- the not-ready runner renders as disabled

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/agent-create-modal.test.ts`
Expected: FAIL if label text is still incorrect or disabled state differs from the expectation.

- [ ] **Step 3: Write minimal implementation**

Keep the existing disabled predicate and rely on the updated shared label helper for option text.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/components/agent-create-modal.test.ts`
Expected: PASS

### Task 3: Pin onboarding runner selector behavior

**Files:**
- Modify: `tests/components/onboarding-page.test.ts`
- Modify: `src/pages/OnboardingPage.tsx`

- [ ] **Step 1: Write the failing test**

Add a test that renders onboarding with one ready runner and one not-ready runner and asserts:

- runner names are displayed
- the not-ready runner option is disabled
- readiness suffix text remains visible

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/onboarding-page.test.ts`
Expected: FAIL because onboarding still uses inline ID-based labels.

- [ ] **Step 3: Write minimal implementation**

Replace inline runner label construction with `formatRunnerLabel(runner)` while keeping the readiness suffix and disabled predicate.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/components/onboarding-page.test.ts`
Expected: PASS

## Chunk 3: Verification And Delivery

### Task 4: Run targeted verification and inspect shared test impact

**Files:**
- Review only: `tests/` in this repo
- Review only: `../companyhelm-common/tests/`

- [ ] **Step 1: Run the targeted frontend suite**

Run: `npm test -- tests/utils/formatting.test.ts tests/components/agent-create-modal.test.ts tests/components/onboarding-page.test.ts`
Expected: PASS

- [ ] **Step 2: Check common test harness relevance**

Inspect `companyhelm-common/tests` for any frontend e2e coverage that depends on runner selector labels.
Expected: no changes required for this repo-local UI text update unless a selector assertion explicitly depends on old labels.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-03-12-runner-selector-labels-design.md \
  docs/superpowers/plans/2026-03-12-runner-selector-labels.md \
  src/utils/formatting.ts \
  src/pages/OnboardingPage.tsx \
  tests/utils/formatting.test.ts \
  tests/components/agent-create-modal.test.ts \
  tests/components/onboarding-page.test.ts
git commit -m "fix: show runner names in assignment selectors"
```
