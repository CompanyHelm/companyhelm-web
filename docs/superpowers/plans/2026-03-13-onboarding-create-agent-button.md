# Onboarding Create Agent Button Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the onboarding create-agent form so the submit button enables once name, runner, SDK, and model are valid, even when the selected model has no reasoning levels.

**Architecture:** Keep the regular create-agent modal behavior unchanged. Add onboarding-specific readiness logic in `OnboardingPage.tsx`, and introduce a focused onboarding submit helper path in `src/utils/agent-creation.ts` that permits an empty reasoning level only when the selected model reports none.

**Tech Stack:** React, TypeScript, Vite, Node test runner (`tsx --test`)

---

## Chunk 1: Onboarding Readiness Coverage

### Task 1: Add failing onboarding readiness coverage

**Files:**
- Modify: `tests/components/onboarding-page.test.ts`
- Modify: `tests/utils/agent-creation.test.ts`

- [ ] **Step 1: Write the failing tests**

Add coverage for:
- onboarding renders an enabled `Create agent` button when `agentName`, a ready runner, available SDK, and available model are set while the model has no reasoning levels
- onboarding utility logic treats a no-reasoning model as submittable for onboarding only

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/components/onboarding-page.test.ts tests/utils/agent-creation.test.ts
```

Expected: FAIL because onboarding still depends on the shared reasoning-required readiness path.

- [ ] **Step 3: Write minimal implementation**

Add the smallest logic needed to support onboarding-specific readiness for no-reasoning models without changing the regular create modal behavior.

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- tests/components/onboarding-page.test.ts tests/utils/agent-creation.test.ts
```

Expected: PASS.

## Chunk 2: Onboarding Submission Path

### Task 2: Add failing coverage for onboarding submission without reasoning

**Files:**
- Modify: `tests/utils/agent-creation.test.ts`
- Modify: `src/utils/agent-creation.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the failing test**

Add utility coverage for an onboarding-specific create path that:
- accepts an empty reasoning value when the selected model exposes zero reasoning levels
- still rejects empty reasoning when reasoning levels are available

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/utils/agent-creation.test.ts
```

Expected: FAIL because the onboarding-specific submit behavior does not exist.

- [ ] **Step 3: Write minimal implementation**

Update `src/utils/agent-creation.ts` to expose onboarding-aware validation/submission behavior, and update `src/App.tsx` to use it only for onboarding submits.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/utils/agent-creation.test.ts
```

Expected: PASS.

## Chunk 3: Verification

### Task 3: Verify targeted frontend behavior and check shared e2e impact

**Files:**
- Review: `../companyhelm-common/tests/system/02-agents/README.md`
- Review: `../companyhelm-common/tests/simulation/02-codex-device-auth/codex-device-auth.spec.ts`

- [ ] **Step 1: Run the focused frontend suite**

Run:

```bash
npm test -- tests/components/onboarding-page.test.ts tests/utils/agent-creation.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run broader frontend verification**

Run:

```bash
npm test -- tests/components/agent-create-modal.test.ts tests/components/onboarding-page.test.ts tests/utils/agent-creation.test.ts
```

Expected: PASS.

- [ ] **Step 3: Check e2e coverage impact**

Review `companyhelm-common` onboarding and agent-creation journeys to confirm no e2e changes are required because the behavior change is onboarding-only and preserves existing reasoning flows when reasoning levels are present.
