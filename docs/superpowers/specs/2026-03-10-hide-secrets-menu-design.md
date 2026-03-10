# Hide Secrets Menu Design

**Date:** 2026-03-10

## Goal

Hide the `Secrets` entry from the frontend side menu for all users while preserving the existing `/secrets` route and internal navigation behavior.

## Current Context

- The side menu is rendered from `NAV_SECTIONS` in `src/utils/constants.ts`.
- Route parsing and path generation also depend on shared navigation constants via `PAGE_IDS` and `NAV_ITEMS`.
- Removing `Secrets` from the shared constants entirely would unintentionally make `/secrets` an unknown page.

## Chosen Approach

Keep `secrets` as a routable page, but exclude it from the menu-specific data structure.

This requires separating:

- visible navigation sections used by the side menu
- route/page lookup data used by path parsing and direct navigation

## Design Details

### Navigation

- Remove the `Secrets` item from the visible `NAV_SECTIONS` menu definition.
- Introduce a separate route item source that still includes `secrets`.
- Continue rendering the side menu from the visible sections only.

### Routing

- Keep `PAGE_IDS`, `NAV_ITEMS`, and related path helpers aware of `secrets`.
- Preserve direct `/secrets` navigation and any existing internal `navigateTo("secrets")` calls.

### Testing

- Add a regression test covering the distinction between visible menu items and known routes.
- Verify that `secrets` is absent from menu sections but still resolves as a valid page/path.

## Out of Scope

- Hiding or removing the `Approvals` menu item
- Blocking direct access to `/secrets`
- Backend or authorization changes
