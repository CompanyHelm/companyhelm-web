# Hide Approvals Menu Design

**Date:** 2026-03-10

## Goal

Hide the `Approvals` entry from the frontend side menu for all users while preserving the existing `/approvals` route and internal navigation behavior.

## Current Context

- The side menu is rendered from `NAV_SECTIONS` in `src/utils/constants.ts`.
- Route parsing and path generation also depend on shared navigation constants via `PAGE_IDS` and `NAV_ITEMS`.
- Removing `approvals` from the shared constants entirely would unintentionally make `/approvals` an unknown page.

## Chosen Approach

Keep `approvals` as a routable page, but exclude it from the menu-specific data structure.

This requires separating:

- visible navigation sections used by the side menu
- route/page lookup data used by path parsing and direct navigation

## Design Details

### Navigation

- Remove the `Approvals` item from the visible `NAV_SECTIONS` menu definition.
- Continue rendering the side menu from the visible sections only.

### Routing

- Keep `PAGE_IDS`, `NAV_ITEMS`, and related path helpers aware of `approvals`.
- Preserve direct `/approvals` navigation and any existing internal `navigateTo("approvals")` calls.

### Testing

- Extend the existing regression test covering hidden menu items versus known routes.
- Verify that `approvals` is absent from menu sections but still resolves as a valid page/path.

## Out of Scope

- Blocking direct access to `/approvals`
- Backend or authorization changes
- Removing the approvals page itself
