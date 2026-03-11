# Onboarding Phase Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix stale company-scoped onboarding so the frontend no longer shows completed runner or first-agent steps, and remove the guided first-chat onboarding step in favor of redirecting to the chats page after onboarding agent creation.

**Architecture:** Extract onboarding phase reconciliation and post-agent-create transition rules into a dedicated utility module. Keep `App.tsx` as the orchestration layer that calls those helpers, simplify `OnboardingPage.tsx` to runner and agent steps only, and update persistence/debug surfaces to remove the obsolete `chat` onboarding phase.

**Tech Stack:** TypeScript, React, node:test, tsx

---

## Chunk 1: Onboarding State Utility And Failing Tests

### Task 1: Add failing tests for onboarding phase reconciliation and redirect decisions

**Files:**
- Create: `tests/utils/onboarding.test.ts`
- Create: `src/utils/onboarding.ts`
- Modify: `src/utils/persistence.ts`

- [ ] **Step 1: Write the failing utility tests**

Add focused tests for a new onboarding utility module that cover:
- stale `"agent"` phase plus `agentCount > 0` returns a cleared or completed onboarding state
- stale `"agent"` phase plus `agentCount === 0` stays on `"agent"`
- stale `"runner"` phase plus `runnerCount > 0` advances away from `"runner"`
- initial auto-detection still chooses `"runner"` when there are no runners
- initial auto-detection still chooses `"agent"` when runners exist but agents do not
- successful onboarding agent creation returns a chats redirect result instead of a `"chat"` phase

- [ ] **Step 2: Run the new test to verify it fails**

Run: `npm test -- tests/utils/onboarding.test.ts`
Expected: FAIL because `src/utils/onboarding.ts` does not exist yet.

- [ ] **Step 3: Implement the onboarding utility module**

Create `src/utils/onboarding.ts` with focused helpers such as:
- deriving the initial company-scoped onboarding phase from runner and agent counts
- reconciling a persisted phase against current selected-company data
- returning the post-agent-create transition that clears onboarding and provides the chats redirect target

Keep the module free of React state so it can be tested directly.

- [ ] **Step 4: Remove the obsolete `chat` onboarding phase type**

Update `src/utils/persistence.ts` to:
- remove `"chat"` from `OnboardingPhase`
- keep persisted onboarding compatibility by tolerating unknown stored values and normalizing them safely if needed

- [ ] **Step 5: Re-run the utility test**

Run: `npm test -- tests/utils/onboarding.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git -C /workspace/frontend add tests/utils/onboarding.test.ts src/utils/onboarding.ts src/utils/persistence.ts
git -C /workspace/frontend commit -m "feat: add onboarding phase helpers"
```

## Chunk 2: Onboarding UI Simplification

### Task 2: Add failing component coverage for the two-step onboarding page

**Files:**
- Create: `tests/components/onboarding-page.test.ts`
- Modify: `src/pages/OnboardingPage.tsx`
- Modify: `src/pages/FlagsPage.tsx`

- [ ] **Step 1: Write the failing component test**

Add render-level assertions that:
- the onboarding stepper shows `Create company`, `Create agent runner`, and `Create first agent`
- the onboarding page no longer renders `Create first chat` or the chat form
- the page still renders the agent form for the `"agent"` phase
- the flags page phase selector no longer exposes a `chat` option

- [ ] **Step 2: Run the component tests to verify they fail**

Run: `npm test -- tests/components/onboarding-page.test.ts`
Expected: FAIL because the page and flags UI still include the chat phase.

- [ ] **Step 3: Simplify the onboarding page**

Update `src/pages/OnboardingPage.tsx` to:
- remove chat-only props, state, and event handlers
- reduce `PHASES` to runner and agent steps after company creation
- submit agent creation directly through the passed callback without local chat transition state
- keep the runner-to-agent transition behavior unchanged

- [ ] **Step 4: Remove the debug UI reference to `chat`**

Update `src/pages/FlagsPage.tsx` to remove the `chat` phase option so the debug page matches the supported onboarding phases.

- [ ] **Step 5: Re-run the component tests**

Run: `npm test -- tests/components/onboarding-page.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git -C /workspace/frontend add tests/components/onboarding-page.test.ts src/pages/OnboardingPage.tsx src/pages/FlagsPage.tsx
git -C /workspace/frontend commit -m "refactor: remove onboarding chat phase"
```

## Chunk 3: App Wiring And Verification

### Task 3: Add failing persistence coverage, wire the app, and verify the redirect flow

**Files:**
- Modify: `src/App.tsx`
- Modify: `tests/utils/persistence.test.ts`
- Modify: `tests/utils/onboarding.test.ts`
- Inspect only: `/workspace/companyhelm-common/tests/system`

- [ ] **Step 1: Extend tests to lock the persistence and redirect behavior**

Add or extend tests so they cover:
- persisted onboarding values with unsupported phases normalize safely
- the onboarding utility returns the chats redirect path for a newly created onboarding agent

- [ ] **Step 2: Run the targeted tests to verify the new expectations fail**

Run:
- `npm test -- tests/utils/persistence.test.ts tests/utils/onboarding.test.ts`

Expected: FAIL because the persistence normalization and App wiring are not complete yet.

- [ ] **Step 3: Wire the helpers into `App.tsx`**

Update `src/App.tsx` to:
- use the onboarding utility for initial phase detection instead of inline phase rules
- reconcile stale persisted runner and agent phases after company data loads
- stop treating `"chat"` as a valid onboarding phase
- after successful onboarding agent creation, clear persisted onboarding and redirect to the chats page using the utility result and existing chat path helpers
- remove obsolete `onCreateFirstChat` and `onSkipToChat` wiring

- [ ] **Step 4: Run targeted regression tests**

Run:
- `npm test -- tests/utils/onboarding.test.ts`
- `npm test -- tests/components/onboarding-page.test.ts`
- `npm test -- tests/utils/persistence.test.ts`

Expected: PASS

- [ ] **Step 5: Run repo-local verification**

Run:
- `npm test`
- `npm run build`

If a lightweight runtime smoke check is needed after the build, start the preview server and confirm it boots without onboarding runtime errors.

- [ ] **Step 6: Inspect shared system coverage**

Review `/workspace/companyhelm-common/tests/system` for onboarding or chats flows and confirm no shared e2e test updates are required for this frontend-only change.

- [ ] **Step 7: Commit**

```bash
git -C /workspace/frontend add src/App.tsx tests/utils/persistence.test.ts tests/utils/onboarding.test.ts
git -C /workspace/frontend commit -m "fix: reconcile onboarding phases"
```
