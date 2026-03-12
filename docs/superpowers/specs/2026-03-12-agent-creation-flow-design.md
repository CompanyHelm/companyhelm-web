# Agent Creation Flow Design

## Summary

Fix the agent creation forms so valid selections can actually submit, move agent-creation workflow logic out of `App.tsx`, and add a shared post-create success state that stays inside the existing onboarding/bootstrap and create-agent modal surfaces.

## Goals

- Fix the frontend bug where selecting all visible agent fields can still leave creation blocked
- Reuse one post-create success component for onboarding/bootstrap and regular agent creation
- Keep `App.tsx` minimal by extracting create-agent workflow logic into dedicated modules/components
- Keep the existing chats route and chats page behavior unchanged
- Document the repository expectation that new workflow logic should not accumulate in `App.tsx`

## Non-Goals

- Change the chats route structure or add a new chat landing page
- Add backend API changes
- Redesign unrelated agent or onboarding UI
- Refactor all of `App.tsx` in one pass beyond the create-agent workflow boundary

## Proposed Structure

### Agent creation workflow extraction

Move create-agent validation, derived form state, and post-create state management into focused files outside `App.tsx`.

Expected responsibilities:

- `App.tsx`
  - compose pages
  - pass company-scoped data and existing mutations/navigation callbacks
  - stop owning detailed create-agent UI workflow logic
- agent creation helper/module(s)
  - derive whether the current create form is submittable
  - validate the selected runner, SDK, model, and reasoning combination
  - normalize post-create view state for both onboarding and regular creation

This keeps the business rules testable without forcing every case through `App.tsx`.

### Shared post-create success component

Add one reusable presentational component for the success state after an agent is created.

It should:

- accept the created agent identity and display name
- render a primary `Chat now` action
- render a secondary `Skip for now` action
- support a busy state while chat creation is in progress
- remain agnostic about whether it is rendered in onboarding or a modal

### Onboarding/bootstrap flow

When the first agent is created during onboarding/bootstrap:

- onboarding is still marked complete
- the create form is replaced in-place with the shared post-create success component
- `Chat now` creates a thread for the new agent, then redirects to the existing chats route with `agentId` and `threadId`
- `Skip for now` exits onboarding and returns the user to the agents list

### Regular create-agent modal flow

When an agent is created from the normal create-agent modal:

- keep the modal open
- replace the form body with the same shared post-create success component
- `Chat now` creates a thread for the new agent, then redirects to the existing chats route with `agentId` and `threadId`
- `Skip for now` closes the modal and leaves the user on the agents list

## Validation Rules

The existing mutation-level guards in `handleCreateAgent` should remain, but the UI should stop using broad page-level booleans as the primary submit gate.

Creation readiness should be derived from the actual selected form state:

- a runner is selected
- that specific runner is ready and connected
- the selected SDK is available for that runner
- the selected model is available for that runner and SDK
- the selected reasoning level exists for that model
- the name is non-empty

This prevents the current failure mode where a user makes valid visible selections but the form remains non-actionable because the wrong top-level readiness flag controls the button or form state.

## File Boundaries

Potential structure, adjusted to the repo's existing patterns:

- new agent creation state/helper module under `src/utils/` or `src/features/agents/`
- shared success component under `src/components/`
- `OnboardingPage.tsx` updated to render success state for bootstrap
- `AgentsPage.tsx` updated to render success state inside the create modal
- `App.tsx` reduced to wiring create-agent callbacks and shared data into those surfaces
- new `CONTRIBUTING.md` added at repo root with the guidance about keeping `App.tsx` minimal

## Data Flow

1. User fills the create-agent form.
2. Derived validation computes whether submission is allowed for the currently selected runner/model pair.
3. Existing create-agent mutation runs.
4. On success, the relevant surface stores a lightweight `createdAgent` state.
5. That surface swaps from form view to shared success view.
6. `Chat now` calls the existing chat creation path for that agent.
7. After the thread is created, navigation uses the existing chats route.
8. `Skip for now` returns to the local non-chat destination for that surface.

## Testing

Add or update focused tests for:

- create-form readiness when the selected runner/model/reasoning combination is valid
- onboarding/bootstrap success state after agent creation
- create-agent modal success state after agent creation
- shared success component actions and busy states
- `Chat now` using the existing create-chat path and redirecting only after a thread is created
- `Skip for now` returning to the agents list or closing the modal without touching the chats route

Check `companyhelm-common` system tests for agent creation/onboarding coverage that may need updates because the success handoff is now in-surface rather than an immediate redirect.

## Risks

- `App.tsx` currently owns a large amount of related state, so extracting just the create-agent workflow needs careful boundaries to avoid duplicate or conflicting state.
- The onboarding and modal flows share behavior but not layout, so the success component must stay presentational and not absorb orchestration logic.
- If the form still mixes “any runner is ready” checks with “selected runner is valid” checks, the original bug will survive in edge cases.
