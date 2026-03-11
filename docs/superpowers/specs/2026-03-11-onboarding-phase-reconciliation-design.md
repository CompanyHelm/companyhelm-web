# Onboarding Phase Reconciliation Design

**Date:** 2026-03-11

## Goal

Prevent the frontend onboarding flow from showing stale `Create first agent` or `Create agent runner` steps when the currently selected company already has the required data, and remove the guided first-chat onboarding step.

## Current Context

- The onboarding UI is rendered from `src/pages/OnboardingPage.tsx`.
- The onboarding state and visibility logic are currently orchestrated from `src/App.tsx`.
- The frontend already loads agents and runners for the selected company.
- `onboardingPhase` is persisted locally and can survive reloads or company switches.
- The current app sets the initial phase when a company has no runners or no agents, but it does not reconcile a persisted stale phase after fresh company data loads.
- The current onboarding flow still includes a `chat` step after agent creation.

## Chosen Approach

Keep onboarding company-scoped and preserve the existing persisted onboarding flow, but extract onboarding reconciliation and next-step decisions into a dedicated helper module. Use that module to clear stale `"runner"` and `"agent"` phases once selected-company data proves those steps are already complete.

Also remove the onboarding `chat` phase entirely. After a successful onboarding agent creation, redirect the user to `/chats` instead of showing a guided first-chat step.

This keeps the fix local to frontend state management, avoids changing backend behavior, keeps `App.tsx` focused on orchestration, and does not repurpose the global `skipOnboarding` flag.

## Design Details

### State Reconciliation

- Continue deriving onboarding eligibility from the currently selected company only.
- After runner and agent data have loaded for the selected company, reconcile the persisted `onboardingPhase` against the actual company state through a dedicated helper module.
- If the persisted phase is `"runner"` and the selected company already has at least one runner, exit the stale runner step.
- If the persisted phase is `"agent"` and the selected company already has at least one agent, clear onboarding so the stale first-agent screen no longer renders.

### Flow Changes

- Remove the onboarding `chat` phase from the onboarding step list and page flow.
- After successful agent creation from onboarding, redirect to `/chats`.
- Do not redirect to `/chats` when stale onboarding is merely reconciled for an existing company. Redirect only after a new onboarding agent is created.

### Visibility Rules

- Keep showing onboarding when the selected company has no runners.
- Keep showing onboarding when the selected company has runners but no agents.
- Hide onboarding automatically when the selected company already has both runners and agents, even if local storage still contains a stale `"runner"` or `"agent"` phase.

### Persistence

- Keep the current local storage persistence mechanism.
- Update persisted onboarding state when stale `"runner"` or `"agent"` phases are reconciled so reloads do not re-open the wrong onboarding step.
- Do not change the meaning or scope of the existing `skipOnboarding` flag.

### Structure

- Keep `App.tsx` responsible for wiring data, navigation, and event handlers.
- Move onboarding phase reconciliation and next-phase decision logic into a separate focused file so the behavior can be tested without rendering the full app component.

### Testing

- Add focused frontend regression coverage around onboarding phase reconciliation.
- Cover at least:
  - persisted `"agent"` phase plus selected company agents present hides onboarding
  - persisted `"agent"` phase plus zero selected company agents keeps agent onboarding visible
  - persisted `"runner"` phase plus selected company runners present does not keep runner onboarding open
- Add coverage that successful onboarding agent creation redirects to `/chats`.

## Out of Scope

- Backend or GraphQL schema changes
- Making `skipOnboarding` company-specific
- Reworking the onboarding page copy or layout
- Adding new onboarding phases
