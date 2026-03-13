# Settings Companies Tab Design

**Date:** 2026-03-13

## Goal

Add a `Companies` tab inside the Settings page so company management is visible and centralized. The tab should list all companies the signed-in user can access, provide a clear `Create company` action, and move company deletion into that tab with a typed confirmation flow.

## Current Context

- `src/pages/SettingsPage.tsx` already owns company-creation UI, but the entry point is a header icon button, which makes the capability easy to miss.
- The app already loads the signed-in user's accessible companies through the existing unscoped companies query in `App.tsx`.
- The left sidebar already contains the active-company selector, and that selector should remain the only place where users switch the active company.
- The backend already supports listing companies, creating a company, and deleting a company. No new API contract is required for this feature.

## Chosen Approach

Keep the change local to the existing Settings page by adding in-page tabs for `General` and `Companies`.

- `General` remains the home for non-company-management settings content such as export.
- `Companies` becomes the only Settings surface for company creation and deletion.
- The sidebar company selector remains unchanged and continues to control the active company.

This avoids route churn, reuses the current application state and mutations, and makes company management visible without introducing a second switching control.

## UI Design

### Settings Tabs

The Settings page should render a small tab strip with:

- `General`
- `Companies`

`General` is the default active tab.

### General Tab

- Remove the Settings header `+` create-company action.
- Keep the existing export section on this tab.
- Remove the delete-company section from this tab.

### Companies Tab

Render a dedicated company-management panel containing:

- a heading and short description
- a `Create company` button that opens the existing shared modal pattern
- a list of all accessible companies from the existing companies state
- a delete action on each company row

The list is informational. It should not duplicate the sidebar company-switcher behavior.

## Interaction Flow

### Create Company

1. User opens `Settings`.
2. User switches to the `Companies` tab.
3. User clicks `Create company`.
4. Frontend opens the existing create-company modal.
5. User submits a valid company name.
6. Frontend runs the existing create-company mutation flow, reloads companies, selects the new company, and navigates as it does today.

### Delete Company

1. User opens the `Companies` tab.
2. User clicks delete on a specific company row.
3. Frontend opens a destructive confirmation modal for that exact company.
4. The modal explains the deletion scope and requires the user to type the exact company name.
5. The delete button stays disabled until the typed value exactly matches the company name.
6. On confirm, frontend runs the existing delete-company mutation against that company id.
7. After success, frontend reloads the accessible companies list.
8. If the deleted company was the active sidebar-selected company, frontend falls back to another accessible company or clears the active selection if none remain.

## State And Error Handling

- Keep the companies data source in `App.tsx`; `SettingsPage` should consume the existing company list and current handlers through props.
- Add local tab-selection state in `SettingsPage`.
- Add local modal state for the delete-confirmation flow.
- Reuse the current create-company error handling.
- Surface delete failures in the Companies tab context so the user can understand why the delete failed.
- Clear typed confirmation state when the delete modal closes or when a different company is targeted.

## Component Boundaries

- `App.tsx`
  - continues to own company list state, selected company reconciliation, and create/delete handlers
  - updates delete handling so any listed company can be targeted, not just the active company
- `SettingsPage.tsx`
  - owns Settings tab state
  - removes the page-header create action
  - renders the `General` and `Companies` tab surfaces
  - renders the create button and company list
  - renders the typed delete-confirmation modal

No backend schema or GraphQL additions are expected.

## Testing

Add or update frontend tests to cover:

- the Settings page shows `General` and `Companies` tabs
- the create-company header icon is absent from the main Settings surface
- the `Companies` tab renders the accessible company list
- the `Create company` button exists only in the `Companies` tab flow
- delete actions are row-specific rather than tied only to the active company
- the delete confirmation modal requires an exact company-name match before enabling delete
- deleting the active company reconciles the selected company after the companies list refreshes

Check `companyhelm-common` for any shared e2e expectations tied to the old Settings layout and update them only if needed.

## Out Of Scope

- Changing the left sidebar company selector behavior
- Adding a second company-switching control inside Settings
- Adding backend endpoints or schema changes for company management
- Changing company creation semantics beyond moving the entry point into the `Companies` tab
