# Settings Export Modal Design

**Date:** 2026-03-13

## Goal

Change the Settings export experience so the page shows an `Export data` button that opens a modal containing the existing export selection controls and export action.

## Current Context

- `src/pages/SettingsPage.tsx` already renders a company-scoped export panel inline on the Settings page.
- The inline panel includes the full export workflow: preset buttons, manual section checkboxes, inline error text, and the `Export YAML` action.
- `src/components/CreationModal.tsx` is the shared modal primitive used elsewhere in the frontend for settings-style forms.
- The current export logic, state, and callbacks already exist and should remain unchanged unless needed to support the modal interaction.

## Chosen Approach

Keep the current export logic and controls intact, but move the export UI from the inline Settings page body into a `CreationModal`. Replace the large inline export panel with a smaller Settings panel that explains the feature and exposes a single `Export data` button.

This keeps the export feature discoverable on the Settings page, preserves the same section-selection experience the user already approved, and avoids introducing a second export implementation path.

## UI Design

### Settings Page Surface

The Settings page should continue to show an export section when a company is selected, but that section becomes compact:

- heading: `Export company data`
- short explanation that export opens a modal with section selection
- one primary action button labeled `Export data`

The inline preset buttons, checkbox list, and export submit button should be removed from the page body.

### Export Modal

Clicking `Export data` opens a modal that contains the current export workflow:

- export explanation copy
- `Sharable` preset button
- `Full dump` preset button
- checkbox list for all export sections
- inline validation and request error text
- `Export YAML` button

The modal title should clearly describe the task, for example `Export company data`.

## Interaction Flow

1. User opens Settings.
2. User clicks `Export data`.
3. Frontend opens the export modal.
4. User selects a preset or manually adjusts sections.
5. Frontend preserves the existing validation rule that at least one section must be selected.
6. User clicks `Export YAML`.
7. The existing export request and browser download flow runs unchanged.
8. The modal stays open while the request is pending so loading and error state remain visible.

## State And Error Handling

- Reuse the existing export selection state owned by `SettingsPage`.
- Add local UI state for whether the export modal is open.
- Keep current request pending behavior:
  - preset buttons disabled while exporting
  - checkbox inputs disabled while exporting
  - submit button disabled while exporting
- Keep current inline error rendering inside the modal so validation and request failures remain visible in context.
- Do not clear selected sections when the modal closes unless existing page-level state already changes elsewhere.

## Component Boundaries

- `SettingsPage.tsx`
  - owns modal open/close state
  - renders the compact inline export section and the export modal
  - reuses the existing export state and callbacks passed in through props
- `CreationModal.tsx`
  - reused as-is unless a small prop adjustment is required for layout parity

No new export-specific component is required unless the existing page file becomes meaningfully harder to read after the modal extraction.

## Testing

Add or update frontend tests to cover:

- the inline Settings page now renders an `Export data` trigger instead of the full inline export form
- the export modal renders the existing preset and checkbox controls when open
- existing pending-state behavior still disables export actions inside the modal
- existing inline validation and request error text still render in the modal context

Verification for this change is frontend-only unless inspecting `companyhelm-common` reveals e2e coverage coupled to the old inline export layout.

## Out Of Scope

- Changing export payload structure or GraphQL behavior
- Adding new export presets or sections
- Auto-closing the modal after a successful download unless required by existing UX patterns
- Moving export into page header actions instead of a Settings page section
