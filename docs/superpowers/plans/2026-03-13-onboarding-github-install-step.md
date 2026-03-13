# Onboarding GitHub Install Step Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real `github` onboarding step after first-agent creation, remove onboarding `Chat now`, finish onboarding after GitHub install callback success on `Repos`, and widen onboarding-only layouts by about 30%.

**Architecture:** Keep existing GitHub callback parsing and installation linking in `App.tsx`, but update the onboarding phase model so active onboarding can transition from `agent` to `github` without forcing onboarding back on for already-provisioned companies. Render the new GitHub terminal step directly in `OnboardingPage.tsx`, keep the regular agent-creation modal unchanged, and scope the width increase to onboarding-specific selectors in `src/index.css`.

**Tech Stack:** React, TypeScript, Vite, Node test runner (`tsx --test`), Playwright system tests in `companyhelm-common`

---

## Chunk 1: Phase Model And Persistence

### Task 1: Add failing coverage for the new `github` onboarding phase

**Files:**
- Modify: `tests/utils/onboarding.test.ts`
- Modify: `tests/utils/persistence.test.ts`
- Modify: `src/utils/onboarding.ts`
- Modify: `src/utils/persistence.ts`

- [ ] **Step 1: Write the failing tests**

Expand onboarding utility coverage to pin the intended phase behavior:

- persisted onboarding accepts `"github"` as a valid stored phase
- `deriveEffectiveOnboardingPhase(...)` still returns `null` when a ready runner and an agent already exist and there is no active onboarding session
- `reconcileOnboardingPhase(...)` advances `"agent"` to `"github"` once `agentCount > 0`
- `reconcileOnboardingPhase(...)` keeps `"github"` stable until completion logic clears it
- remove the obsolete `getPostAgentCreationOnboardingRedirectPath(...)` assertion because onboarding no longer routes to chats after agent creation

Example target assertions:

```ts
assert.equal(
  reconcileOnboardingPhase({
    phase: "agent",
    runnerCount: 1,
    readyRunnerCount: 1,
    agentCount: 1,
  }),
  "github",
);

assert.equal(
  deriveEffectiveOnboardingPhase({
    runnerCount: 1,
    readyRunnerCount: 1,
    agentCount: 1,
  }),
  null,
);
```

- [ ] **Step 2: Run the utility tests to verify red**

Run:

```bash
npm test -- tests/utils/onboarding.test.ts tests/utils/persistence.test.ts
```

Expected: FAIL because `"github"` is not part of the persisted phase model and the current reconciliation logic clears onboarding instead of advancing to the new phase.

- [ ] **Step 3: Write the minimal implementation**

Update `src/utils/persistence.ts`:

- extend `OnboardingPhase` to include `"github"`
- accept `"github"` in `normalizeOnboardingPhase(...)`

Update `src/utils/onboarding.ts`:

- keep `deriveEffectiveOnboardingPhase(...)` returning `null` for already-ready companies
- change `reconcileOnboardingPhase(...)` so active onboarding can advance `agent -> github`
- keep `github` sticky until explicit completion
- delete `getPostAgentCreationOnboardingRedirectPath(...)` if nothing else references it

- [ ] **Step 4: Run the utility tests to verify green**

Run:

```bash
npm test -- tests/utils/onboarding.test.ts tests/utils/persistence.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the phase-model changes**

```bash
git add tests/utils/onboarding.test.ts tests/utils/persistence.test.ts src/utils/onboarding.ts src/utils/persistence.ts
git commit -m "feat: add github onboarding phase"
```

## Chunk 2: Onboarding UI And Layout

### Task 2: Add failing coverage for the GitHub terminal step and wider onboarding layout

**Files:**
- Modify: `tests/components/onboarding-page.test.ts`
- Create: `tests/pages/onboarding-layout.test.ts`
- Modify: `src/pages/OnboardingPage.tsx`
- Modify: `src/pages/FlagsPage.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing tests**

Extend `tests/components/onboarding-page.test.ts` so it asserts:

- the stepper includes `Install GitHub App`
- the `github` phase renders a primary `Install GitHub App` action and a secondary `Skip for now`
- the `github` phase does not render the agent form fields
- onboarding no longer renders `Chat now` after first-agent creation
- the debug phase selector includes `github`

Create `tests/pages/onboarding-layout.test.ts` that reads `src/index.css` and asserts:

- `.onboarding-stepper` uses `width: min(57rem, 100%)`
- `.runner-onboarding-panel` uses `width: min(57rem, 100%)`
- the shared `.page-stack` width rules are unchanged

Example CSS assertion shape:

```ts
assert.match(
  indexCssSource,
  /\.onboarding-stepper\s*\{[^}]*width:\s*min\(57rem,\s*100%\);/s,
);
```

- [ ] **Step 2: Run the page and CSS tests to verify red**

Run:

```bash
npm test -- tests/components/onboarding-page.test.ts tests/pages/onboarding-layout.test.ts
```

Expected: FAIL because the stepper still ends at agent creation, onboarding still references chat actions, and the onboarding width is still `44rem`.

- [ ] **Step 3: Write the minimal UI implementation**

Update `src/pages/OnboardingPage.tsx` to:

- add a fourth phase entry for `github`
- remove onboarding-only dependence on `AgentCreatedActions`
- render a dedicated GitHub terminal panel when `onboardingPhase === "github"`
- accept a `githubAppInstallUrl` prop and use it for the install action
- keep the existing agent creation form intact for `onboardingPhase === "agent"`

Update `src/pages/FlagsPage.tsx` to add `github` to the debug phase selector.

Update `src/index.css` to widen onboarding-only selectors from `44rem` to `57rem` without changing shared page containers.

- [ ] **Step 4: Run the page and CSS tests to verify green**

Run:

```bash
npm test -- tests/components/onboarding-page.test.ts tests/pages/onboarding-layout.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the onboarding UI updates**

```bash
git add tests/components/onboarding-page.test.ts tests/pages/onboarding-layout.test.ts src/pages/OnboardingPage.tsx src/pages/FlagsPage.tsx src/index.css
git commit -m "feat: add github onboarding terminal step"
```

## Chunk 3: Gate And App Wiring

### Task 3: Add failing coverage for gate behavior and wire the phase transition through the app

**Files:**
- Modify: `tests/components/onboarding-gate.test.ts`
- Modify: `src/components/OnboardingGate.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the failing tests**

Extend `tests/components/onboarding-gate.test.ts` to assert:

- an explicit persisted `github` phase still renders onboarding, even when a runner and agent already exist
- a company with `onboardingPhase: null`, a ready runner, and an agent still renders nothing

Example target assertion:

```ts
const markup = renderOnboardingGateMarkup({
  onboardingPhase: "github",
  agentRunners: [readyRunner],
  agents: [{ id: "agent-1" }],
  githubAppInstallUrl: "https://github.com/apps/example/installations/new?state=company-1",
});

assert.match(markup, />Install GitHub App</);
assert.doesNotMatch(markup, />Chat now</);
```

- [ ] **Step 2: Run the gate tests to verify red**

Run:

```bash
npm test -- tests/components/onboarding-gate.test.ts
```

Expected: FAIL because the current gate forces post-create onboarding back into the `agent` screen and does not preserve an explicit `github` phase.

- [ ] **Step 3: Write the minimal wiring implementation**

Update `src/components/OnboardingGate.tsx` to:

- remove onboarding-only `createdAgent` / `Chat now` flow state
- stop forcing `resolvedPhase` to `"agent"` after agent creation
- on successful onboarding agent creation, set the onboarding phase to `"github"` and persist it
- pass `githubAppInstallUrl` through to `OnboardingPage.tsx`
- use the existing `onSkip` completion path for `Skip for now` on the GitHub step

Update `src/App.tsx` to:

- pass `githubAppInstallUrl` into `OnboardingGate`
- include `"github"` anywhere onboarding phase comparisons currently enumerate actionable phases
- after a successful `addGithubInstallation` callback link, call the existing onboarding completion path when `onboardingPhase === "github"`
- keep the regular agent-create modal and `AgentCreatedActions` behavior unchanged

- [ ] **Step 4: Run the focused gate and onboarding tests to verify green**

Run:

```bash
npm test -- tests/utils/onboarding.test.ts tests/components/onboarding-page.test.ts tests/components/onboarding-gate.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the gate and app wiring**

```bash
git add tests/components/onboarding-gate.test.ts src/components/OnboardingGate.tsx src/App.tsx
git commit -m "feat: finish onboarding after github install"
```

## Chunk 4: Verification And Shared E2E Review

### Task 4: Verify the frontend repo and confirm whether shared e2e coverage needs changes

**Files:**
- Review: `../companyhelm-common/tests/system/02-agents/agents.spec.ts`
- Review: `../companyhelm-common/tests/simulation/02-codex-device-auth/codex-device-auth.spec.ts`
- Review: `../companyhelm-common/tests/system/support/app.ts`

- [ ] **Step 1: Run the focused frontend verification suite**

Run:

```bash
npm test -- tests/utils/onboarding.test.ts tests/utils/persistence.test.ts tests/components/onboarding-page.test.ts tests/components/onboarding-gate.test.ts tests/pages/onboarding-layout.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full frontend verification**

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

- [ ] **Step 3: Smoke the onboarding flow locally**

Run the frontend and verify manually that:

- onboarding progresses `runner -> configuring -> agent -> github`
- the GitHub step shows `Install GitHub App` and `Skip for now`
- skipping completes onboarding without showing `Chat now`
- a callback-style return still lands on `Repos`

Suggested command:

```bash
npm run dev
```

Expected: the local frontend starts successfully and the onboarding flow is manually testable in the browser.

- [ ] **Step 4: Review shared `companyhelm-common` coverage**

Inspect the common repo files above and confirm whether any assertion depends on onboarding ending at agent creation or on a post-create chat CTA.

If no shared test changes are needed, record that explicitly in the implementation summary.

If shared test changes are needed, update them and run the smallest relevant Playwright slice, for example:

```bash
cd ../companyhelm-common/tests
npx playwright test system/02-agents/agents.spec.ts --project=system
```

Expected: PASS for any updated shared coverage.
