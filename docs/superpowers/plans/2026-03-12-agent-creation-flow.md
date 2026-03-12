# Agent Creation Flow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix blocked agent creation in onboarding and the regular create modal, extract create-agent workflow logic out of `App.tsx`, and add a shared in-surface post-create success state with `Chat now` and `Skip for now`.

**Architecture:** Keep the existing chats route untouched and reuse the existing thread-creation path. Move create-agent readiness and post-create workflow state into focused modules/components, then render a shared success component from `OnboardingPage.tsx` and the create-agent modal in `AgentsPage.tsx`.

**Tech Stack:** React, TypeScript, Vite, Node test runner (`tsx --test`)

---

## Chunk 1: Agent Creation Readiness

### Task 1: Add failing coverage for selected-runner-based create readiness

**Files:**
- Create: `tests/utils/agent-creation.test.ts`
- Create: `src/utils/agent-creation.ts`
- Modify: `src/pages/OnboardingPage.tsx`
- Modify: `src/pages/AgentsPage.tsx`

- [ ] **Step 1: Write the failing test**

Add utility-level tests for a helper that answers whether the create form is ready based on the selected runner and selected model state, not just whether any runner is ready.

Cover:
- valid selected runner/model/reasoning returns ready
- selected runner offline returns blocked
- missing model returns blocked
- missing reasoning returns blocked
- unavailable SDK for the selected runner returns blocked

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/utils/agent-creation.test.ts
```

Expected: FAIL because the helper module does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/agent-creation.ts` with focused helpers for:
- selected runner lookup
- create readiness / disabled-state derivation
- any display-safe metadata needed by both forms

Update `OnboardingPage.tsx` and `AgentsPage.tsx` to use the helper for submit/button gating.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/utils/agent-creation.test.ts
```

Expected: PASS.

## Chunk 2: Shared Post-Create Success UI

### Task 2: Add failing coverage for the shared success component

**Files:**
- Create: `src/components/AgentCreatedActions.tsx`
- Create: `tests/components/agent-created-actions.test.ts`

- [ ] **Step 1: Write the failing test**

Cover:
- created agent name is rendered
- `Chat now` and `Skip for now` actions render
- busy state disables actions and changes copy when chat creation is in progress

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/components/agent-created-actions.test.ts
```

Expected: FAIL because the component does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/AgentCreatedActions.tsx` as a presentational component only.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/components/agent-created-actions.test.ts
```

Expected: PASS.

## Chunk 3: Onboarding And Modal Success States

### Task 3: Add failing coverage for onboarding and modal post-create rendering

**Files:**
- Modify: `tests/components/onboarding-page.test.ts`
- Create: `tests/components/agents-page.test.ts`
- Modify: `src/pages/OnboardingPage.tsx`
- Modify: `src/pages/AgentsPage.tsx`

- [ ] **Step 1: Write the failing tests**

Add assertions that:
- onboarding can render the shared success component instead of the create form after a successful create
- the create-agent modal can render the shared success component instead of the form after a successful create
- onboarding `Skip for now` text exists without redirecting to chat
- modal `Skip for now` closes the modal path via callback

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/components/onboarding-page.test.ts tests/components/agents-page.test.ts
```

Expected: FAIL because neither surface supports the success state yet.

- [ ] **Step 3: Write minimal implementation**

Update both surfaces to accept/render:
- a `createdAgent` payload
- `onChatNow`
- `onSkipPostCreate`
- busy state for chat creation

Reuse `AgentCreatedActions.tsx` in both places.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/components/onboarding-page.test.ts tests/components/agents-page.test.ts
```

Expected: PASS.

## Chunk 4: App Wiring Extraction

### Task 4: Move create-agent workflow logic out of `App.tsx`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/utils/onboarding.ts`
- Create or modify: `src/utils/agent-creation.ts`

- [ ] **Step 1: Add failing or tightening tests if existing coverage does not pin the new wiring**

If needed, add the smallest extra assertions in the closest test file before changing `App.tsx`.

- [ ] **Step 2: Run the focused suite before extraction**

Run:

```bash
npm test -- tests/utils/agent-creation.test.ts tests/components/agent-created-actions.test.ts tests/components/onboarding-page.test.ts tests/components/agents-page.test.ts tests/utils/onboarding.test.ts
```

Expected: PASS after prior tasks and before the extraction edit.

- [ ] **Step 3: Write minimal implementation**

Refactor `App.tsx` so it:
- delegates create readiness logic to helpers
- stops embedding the detailed post-create workflow inline
- stores only the minimal shared state needed to pass data and callbacks into `OnboardingPage.tsx` and `AgentsPage.tsx`
- leaves chats route behavior unchanged

Use the existing create-chat action for `Chat now` and only navigate after thread creation succeeds.

- [ ] **Step 4: Run the focused suite after extraction**

Run:

```bash
npm test -- tests/utils/agent-creation.test.ts tests/components/agent-created-actions.test.ts tests/components/onboarding-page.test.ts tests/components/agents-page.test.ts tests/utils/onboarding.test.ts
```

Expected: PASS.

## Chunk 5: Contributor Guidance And Verification

### Task 5: Add contribution guidance and verify repo behavior

**Files:**
- Create: `CONTRIBUTING.md`
- Review: `../companyhelm-common/tests/system/02-agents/agents.spec.ts`
- Review: `../companyhelm-common/tests/system/03-agent-chats/agent-chats.spec.ts`

- [ ] **Step 1: Add the repo guidance**

Create `CONTRIBUTING.md` with a short section that:
- keeps `App.tsx` minimal
- recommends moving new workflow/UI logic into dedicated files/components
- prefers reusable components for shared flows

- [ ] **Step 2: Run frontend verification**

Run:

```bash
npm test
```

Expected: PASS.

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Review shared e2e coverage**

Inspect the relevant `companyhelm-common` system tests and confirm whether the in-surface post-create success flow requires any e2e changes.

- [ ] **Step 4: If shared e2e changes are required, update them and run the relevant companyhelm-common system tests**

Use the existing test runner guidance in `companyhelm-common/tests`.

