# Runner Selector Labels Design

## Summary

Update frontend runner selectors so they display runner names instead of runner IDs in:

- the create agent modal
- the edit agent modal
- onboarding agent creation

Runners that are not ready must remain visible but disabled in the relevant selector UIs.

## Current Problem

The shared `formatRunnerLabel` helper currently formats runners from their ID and connection state. This leaks internal IDs into agent assignment flows. Onboarding also duplicates separate label logic and uses an ID fallback directly in the page component.

## Approved Behavior

- Runner option labels should use the runner `name`.
- No null-name fallback handling is required.
- Not-ready runners should remain listed but disabled where readiness matters.
- Onboarding should use the same shared label helper as the create and edit modals.

## Design

### Shared Formatting

Change `src/utils/formatting.ts` so `formatRunnerLabel(runner)` returns `runner.name`.

### Create Agent Modal

Keep existing readiness gating via `isRunnerReadyAndConnected(runner)`.

- Ready runners stay selectable.
- Not-ready runners stay in the `<select>` but remain disabled.
- Option labels come from `formatRunnerLabel`.

### Edit Agent Modal

Use the same shared label helper so the edit flow shows the runner name rather than the runner ID.

The edit modal currently allows selecting any runner. This change only updates the displayed label text.

### Onboarding

Replace the inline runner option label logic with `formatRunnerLabel(runner)`.

- Keep disabled state for not-ready runners.
- Keep readiness text in the option label so disabled entries are visibly not ready.

## Testing

Add or update tests for:

- `formatRunnerLabel`
- create agent modal runner option text
- onboarding runner option text and disabled state for not-ready runners
