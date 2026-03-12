# Onboarding Gate Design

## Summary

Add a dedicated `OnboardingGate` container component that isolates onboarding visibility, phase derivation, and company-scoped presence checks from `App.tsx`.

The gate only runs when:

- a company is selected
- `skipOnboarding` is `false`

When onboarding is bypassed through the flag, `App.tsx` does not render the gate at all.

## Goals

- Stop growing onboarding orchestration inside `App.tsx`
- Check runner and agent presence through separate company-scoped checks before deciding which onboarding UI to show
- Transparently mark onboarding complete when the company already has a ready runner and an agent
- Add a dedicated onboarding screen for a new `configuring` phase when a runner exists but is not ready yet

## Non-Goals

- Change the global meaning of `skipOnboarding`
- Redesign unrelated onboarding visuals
- Add backend API changes

## Proposed Structure

### `OnboardingGate`

Create a new component responsible for:

- deciding whether onboarding should render for the selected company
- loading company-scoped runner presence data
- loading company-scoped agent presence data
- deriving the effective onboarding phase
- persisting onboarding completion transparently when onboarding requirements are already satisfied

`App.tsx` remains the top-level orchestrator, but only for:

- deciding whether onboarding is globally bypassed
- rendering `OnboardingGate` instead of embedding onboarding decision effects directly
- passing through existing create-runner and create-agent handlers/state needed by the onboarding UI

### `OnboardingPage`

Keep `OnboardingPage` as the UI component for onboarding steps, but expand it to support a new distinct `configuring` screen. The page should remain presentation-focused and should not own the preflight company checks.

### Onboarding Utilities

Extend onboarding utility logic so phase derivation is explicit and testable. The utilities should work from normalized counts and ready-runner state instead of mixing those decisions directly into effects.

## Phase Model

The effective onboarding phases become:

- `runner`: no runner records exist for the selected company
- `configuring`: at least one runner record exists, but no runner is ready
- `agent`: at least one ready runner exists, but no agent exists
- `done`/`null`: onboarding is complete and should not render

Phase derivation should follow this order:

1. If `skipOnboarding` is `true`, do not render the gate.
2. If no selected company exists, onboarding is not shown.
3. If runner count is `0`, phase is `runner`.
4. If runner count is greater than `0` and ready-runner count is `0`, phase is `configuring`.
5. If ready-runner count is greater than `0` and agent count is `0`, phase is `agent`.
6. If ready-runner count is greater than `0` and agent count is greater than `0`, onboarding is complete and persisted transparently.

## Data Flow

`OnboardingGate` performs separate checks for:

- runner existence/readiness
- agent existence

These checks are only used to decide onboarding state. They should not depend on whichever broader page data loaders happen to run for the active route.

The gate then:

- derives the current phase from the fetched state
- compares it with persisted onboarding state if one exists
- clears or writes persisted onboarding state as needed
- renders nothing when onboarding is complete
- renders `OnboardingPage` when one of the actionable phases remains

## Persistence Rules

- If onboarding is complete because the company already has a ready runner and an agent, persist completion transparently so the user does not see stale onboarding.
- If a runner or agent disappears later, the gate should derive the correct phase again from fresh checks rather than trusting stale persisted state.
- Existing `skipOnboarding` behavior remains unchanged and takes precedence over all onboarding checks.

## UI Changes

Add a dedicated onboarding screen for `configuring` with distinct copy from the create-runner step.

The `configuring` screen should:

- explain that the runner already exists but is not ready yet
- focus on bringing the runner online rather than creating another runner
- preserve the onboarding-specific layout rather than falling back to a generic app page

The existing create-runner and create-agent screens remain, but are driven by the gate instead of ad hoc page-level effects in `App.tsx`.

## Testing

Add or update tests for:

- onboarding phase derivation with `runner`, `configuring`, `agent`, and complete states
- transparent completion persistence when a ready runner and agent already exist
- bypass behavior when `skipOnboarding` is `true`
- `OnboardingGate` rendering the correct onboarding screen for each phase
- the distinct `configuring` onboarding screen

Check shared e2e coverage in `companyhelm-common` for onboarding assertions that may need to account for the new `configuring` stage.

## Risks

- The existing app-level runner and agent loaders already update overlapping state, so the gate needs a clean boundary to avoid conflicting effects.
- The current onboarding state supports `runner`, `agent`, and `done`; adding `configuring` requires careful persistence normalization and stale-state reconciliation.
- If runner readiness and runner existence are conflated again in multiple places, onboarding regressions will be easy to reintroduce.
