# Reorganize Left Menu Design

**Date:** 2026-03-11

## Goal

Improve the frontend left menu information architecture so the sections reflect clearer product domains and the current items are easier to understand as a system.

## Current Context

- The left menu is defined in `src/utils/constants.ts` through `NAV_SECTIONS`.
- The menu is rendered directly from those sections in `src/App.tsx`.
- The current top-level grouping mixes product areas:
  - `Work` contains end-user workflow pages.
  - `Intelligence` combines authoring, governance, packaging, integrations, and secrets.
  - `Operate` mixes runtime and repository management.
- This makes the menu harder to reason about because adjacent items do not share one clear mental model.

## Chosen Approach

Keep the existing left-menu component structure and only change the navigation section labels and item membership.

The new grouping should be:

- `Workspace`
  - `Dashboard`
  - `Tasks`
  - `Chats`
- `AI Studio`
  - `Agents`
  - `Skills`
  - `Skill Groups`
  - `Roles`
- `Platform`
  - `Agent Runner`
  - `MCP Servers`
  - `Git Skill Packages`
  - `Repos`
  - `Secrets`

`Settings` and `Profile` remain in the bottom utility navigation.

## Design Details

### Navigation Structure

- Rename `Work` to `Workspace`.
- Replace `Intelligence` with `AI Studio`.
- Replace `Operate` with `Platform`.
- Move `Chats` from the current `Operate` section into `Workspace`.
- Move `Git Skill Packages` from the current `Intelligence` section into `Platform`.
- Keep `Approvals` hidden from the visible menu as it is today.

### Routing And Behavior

- Do not change page ids, paths, route parsing, or hidden-page handling.
- Keep `NAV_ITEMS`, `PAGE_IDS`, and related route helpers functioning exactly as they do today.
- Limit the behavior change to the visible organization and labeling of `NAV_SECTIONS`.

### Testing

- Extend the existing navigation constants regression test to assert the revised section labels and item ordering.
- Continue verifying that hidden-but-routable items such as `approvals` remain excluded from visible navigation while still being valid routes.

## Out Of Scope

- Iconography, badges, or visual restyling of the side menu
- Collapsible subsections or nested navigation
- Changes to page routes or page ownership
- Backend, API, or authorization changes
