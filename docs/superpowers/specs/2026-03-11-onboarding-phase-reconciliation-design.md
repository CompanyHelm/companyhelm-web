# Onboarding Phase Reconciliation Design

**Date:** 2026-03-11

## Goal

Prevent the frontend onboarding flow from showing stale `Create first agent` or `Create agent runner` steps when the currently selected company already has the required data.

## Current Context

- The onboarding UI is rendered from `src/pages/OnboardingPage.tsx`.
- The onboarding state and visibility logic live in `src/App.tsx`.
- The frontend already loads agents and runners for the selected company.
- `onboardingPhase` is persisted locally and can survive reloads or company switches.
- The current app sets the initial phase when a company has no runners or no agents, but it does not reconcile a persisted stale phase after fresh company data loads.

## Chosen Approach

Keep onboarding company-scoped and preserve the existing persisted onboarding flow, but add reconciliation logic in `src/App.tsx` so stale `"runner"` and `"agent"` phases are cleared or advanced once selected-company data proves those steps are already complete.

This keeps the fix local to frontend state management, avoids changing backend behavior, and does not repurpose the global `skipOnboarding` flag.

## Design Details

### State Reconciliation

- Continue deriving onboarding eligibility from the currently selected company only.
- After runner and agent data have loaded for the selected company, reconcile the persisted `onboardingPhase` against the actual company state.
- If the persisted phase is `"runner"` and the selected company already has at least one runner, exit the stale runner step.
- If the persisted phase is `"agent"` and the selected company already has at least one agent, clear onboarding so the stale first-agent screen no longer renders.
- Leave the `"chat"` phase unchanged so a user can still finish the guided first-chat step after creating an agent.

### Visibility Rules

- Keep showing onboarding when the selected company has no runners.
- Keep showing onboarding when the selected company has runners but no agents.
- Hide onboarding automatically when the selected company already has both runners and agents, even if local storage still contains a stale onboarding phase.

### Persistence

- Keep the current local storage persistence mechanism.
- Update persisted onboarding state when stale `"runner"` or `"agent"` phases are reconciled so reloads do not re-open the wrong onboarding step.
- Do not change the meaning or scope of the existing `skipOnboarding` flag.

### Testing

- Add focused frontend regression coverage around onboarding phase reconciliation.
- Cover at least:
  - persisted `"agent"` phase plus selected company agents present hides onboarding
  - persisted `"agent"` phase plus zero selected company agents keeps agent onboarding visible
  - persisted `"runner"` phase plus selected company runners present does not keep runner onboarding open

## Out of Scope

- Backend or GraphQL schema changes
- Making `skipOnboarding` company-specific
- Reworking the onboarding page copy or layout
- Changing first-chat onboarding behavior
