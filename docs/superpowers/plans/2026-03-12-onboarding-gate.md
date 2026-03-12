# Onboarding Gate Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move onboarding presence checks and phase derivation into a dedicated `OnboardingGate`, add a distinct `configuring` runner stage, and transparently complete onboarding when a ready runner and agent already exist.

**Architecture:** Keep `App.tsx` as the top-level owner of application data and mutation handlers, but extract onboarding visibility and preflight decision-making into a dedicated `OnboardingGate` container. Extend onboarding utilities and UI to support a `configuring` phase so runner existence, runner readiness, and agent existence are handled as separate states.

**Tech Stack:** React, TypeScript, Vite, Node test runner (`tsx --test`)

---

## Chunk 1: Phase Model And Persistence

### Task 1: Add failing onboarding utility coverage for the `configuring` phase and transparent completion

**Files:**
- Modify: `tests/utils/onboarding.test.ts`
- Modify: `src/utils/onboarding.ts`
- Modify: `src/utils/persistence.ts`

- [ ] **Step 1: Expand the utility test file with the new phase expectations**

Add focused assertions for:
- `runner` when there are no runner records
- `configuring` when runner records exist but none are ready
- `agent` when a ready runner exists but there are no agents
- `null`/complete when both a ready runner and an agent exist
- persisted `runner` or `agent` values being reconciled away when fresh counts show onboarding is already satisfied

Example target shape:

```ts
assert.equal(
  deriveEffectiveOnboardingPhase({
    runnerCount: 1,
    readyRunnerCount: 0,
    agentCount: 0,
  }),
  "configuring",
);
```

- [ ] **Step 2: Run the utility tests to verify they fail for the missing behavior**

Run:

```bash
npm test -- tests/utils/onboarding.test.ts
```

Expected: FAIL because `configuring` is not part of the onboarding phase model yet and the utility helpers do not derive the new state.

- [ ] **Step 3: Implement the minimal utility and persistence updates**

Update `src/utils/persistence.ts` so `OnboardingPhase` includes `"configuring"` and persisted onboarding normalization accepts it.

Update `src/utils/onboarding.ts` to centralize a single phase decision helper, for example:

```ts
export function deriveEffectiveOnboardingPhase({
  runnerCount,
  readyRunnerCount,
  agentCount,
}: {
  runnerCount: number;
  readyRunnerCount: number;
  agentCount: number;
}): OnboardingPhase {
  if (normalizeCount(runnerCount) === 0) return "runner";
  if (normalizeCount(readyRunnerCount) === 0) return "configuring";
  if (normalizeCount(agentCount) === 0) return "agent";
  return null;
}
```

Keep reconciliation helpers focused on persisted-state cleanup, not UI rendering.

- [ ] **Step 4: Run the utility tests again to verify green**

Run:

```bash
npm test -- tests/utils/onboarding.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the utility phase-model changes**

```bash
git add tests/utils/onboarding.test.ts src/utils/onboarding.ts src/utils/persistence.ts
git commit -m "feat: add configuring onboarding phase"
```

## Chunk 2: Dedicated Gate Component

### Task 2: Add failing component coverage for `OnboardingGate`

**Files:**
- Create: `tests/components/onboarding-gate.test.ts`
- Create: `src/components/OnboardingGate.tsx`

- [ ] **Step 1: Write component tests that describe the new gate decisions**

Cover these cases with a lightweight render harness:
- returns nothing when `skipOnboarding` is `true`
- renders the runner onboarding screen when no runners exist
- renders the configuring onboarding screen when runners exist but none are ready
- renders the agent onboarding screen when a ready runner exists but there are no agents
- transparently completes onboarding and renders nothing when both a ready runner and an agent exist

The test harness should inject runner and agent presence payloads rather than depending on full `App.tsx`.

- [ ] **Step 2: Run the gate test file to verify it fails**

Run:

```bash
npm test -- tests/components/onboarding-gate.test.ts
```

Expected: FAIL because `src/components/OnboardingGate.tsx` does not exist yet.

- [ ] **Step 3: Implement `OnboardingGate` with explicit boundaries**

Create `src/components/OnboardingGate.tsx` as a container that:
- exits early when `skipOnboarding` is `true` or there is no selected company
- performs separate company-scoped runner and agent checks using injected async callbacks from `App.tsx`
- derives the effective phase through `src/utils/onboarding.ts`
- persists completion transparently when the derived phase is complete
- renders `OnboardingPage` only for actionable phases

Keep the component focused on onboarding orchestration. Do not move general-purpose page loading into it.

- [ ] **Step 4: Run the gate tests again**

Run:

```bash
npm test -- tests/components/onboarding-gate.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the gate component**

```bash
git add tests/components/onboarding-gate.test.ts src/components/OnboardingGate.tsx
git commit -m "feat: add onboarding gate component"
```

## Chunk 3: Onboarding UI For The `configuring` Stage

### Task 3: Add failing UI coverage for the distinct configuring screen

**Files:**
- Modify: `tests/components/onboarding-page.test.ts`
- Modify: `src/pages/OnboardingPage.tsx`
- Modify: `src/pages/FlagsPage.tsx`

- [ ] **Step 1: Extend the page tests for the new phase**

Add assertions that:
- the onboarding stepper includes `Configuring runner`
- the `configuring` phase renders distinct copy for an existing-but-not-ready runner
- the debug phase selector includes `configuring`
- the configuring screen does not show the runner creation form

Example expectation:

```ts
assert.match(markup, />Configuring runner</);
assert.doesNotMatch(markup, /id="onboarding-runner-name"/);
```

- [ ] **Step 2: Run the onboarding page tests to verify they fail**

Run:

```bash
npm test -- tests/components/onboarding-page.test.ts
```

Expected: FAIL because `OnboardingPage` and `FlagsPage` do not expose the new phase yet.

- [ ] **Step 3: Implement the minimal UI changes**

Update `src/pages/OnboardingPage.tsx` to:
- add `configuring` to the stepper between `runner` and `agent`
- render a dedicated screen for the `configuring` phase
- keep the existing runner-creation UI under the `runner` phase
- keep the existing agent-creation UI under the `agent` phase

Update `src/pages/FlagsPage.tsx` so the debug phase selector can represent the new phase.

- [ ] **Step 4: Run the page tests again**

Run:

```bash
npm test -- tests/components/onboarding-page.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the onboarding UI updates**

```bash
git add tests/components/onboarding-page.test.ts src/pages/OnboardingPage.tsx src/pages/FlagsPage.tsx
git commit -m "feat: add configuring onboarding screen"
```

## Chunk 4: App Integration And Verification

### Task 4: Integrate `OnboardingGate` into `App.tsx` and verify the frontend flow

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/OnboardingGate.tsx`
- Modify: `src/pages/OnboardingPage.tsx`
- Review: `../companyhelm-common/tests/system/support/app.ts`
- Review: `../companyhelm-common/tests/simulation/02-codex-device-auth/codex-device-auth.spec.ts`

- [ ] **Step 1: Add failing integration coverage if the existing tests do not exercise `App.tsx` wiring sufficiently**

If the new gate wiring is not already covered by the component tests, add the smallest focused assertions necessary in the closest existing test file before modifying `App.tsx`.

- [ ] **Step 2: Run the focused frontend tests before wiring**

Run:

```bash
npm test -- tests/utils/onboarding.test.ts tests/components/onboarding-page.test.ts tests/components/onboarding-gate.test.ts
```

Expected: PASS before integration edits, giving a stable baseline.

- [ ] **Step 3: Replace the inline onboarding orchestration in `App.tsx`**

Update `src/App.tsx` to:
- remove the inline onboarding phase reconciliation effect that depends on general runner-loading state
- stop using the broad `showOnboarding` expression as the source of truth
- render `OnboardingGate` when a company is selected and `skipOnboarding` is `false`
- pass existing create-runner, create-agent, runner-auth, persistence, and navigation callbacks into the gate
- continue to bypass onboarding entirely when `skipOnboarding` is `true`

Keep the existing create-runner and create-agent handlers in `App.tsx`; the gate should orchestrate, not duplicate, those mutations.

- [ ] **Step 4: Run the focused frontend tests after integration**

Run:

```bash
npm test -- tests/utils/onboarding.test.ts tests/components/onboarding-page.test.ts tests/components/onboarding-gate.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run the full frontend test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 6: Review shared e2e coverage and update only if assertions now conflict**

Check:
- `../companyhelm-common/tests/system/support/app.ts`
- `../companyhelm-common/tests/simulation/02-codex-device-auth/codex-device-auth.spec.ts`

If the onboarding expectations still hold, leave them unchanged. If the new `configuring` stage changes visible text or phase assumptions, make the smallest compatible update there.

- [ ] **Step 7: If shared e2e tests changed, run the relevant shared tests**

If `companyhelm-common` changes are required, run the smallest relevant Playwright scope first. If no shared test files change, skip this step and document that only frontend tests were required.

- [ ] **Step 8: Commit the integration work**

```bash
git add src/App.tsx src/components/OnboardingGate.tsx src/pages/OnboardingPage.tsx
git commit -m "feat: gate onboarding by runner readiness"
```
