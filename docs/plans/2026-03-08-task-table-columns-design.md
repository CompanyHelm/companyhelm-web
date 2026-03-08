# Task Table Column Controls Design

## Summary

This change updates the shared task table used for both root tasks and subtasks so the page layout does not overflow horizontally. When the table needs more width than the panel allows, the table region should become horizontally scrollable.

The same change adds a small column picker menu in the table toolbar. Users can show or hide optional columns with a multi-select checklist. The selected column set is shared between the top-level task table and the subtask table because both views render the same `TaskTableView` component with the same columns.

## Goals

- Keep the task page container from overflowing to the right.
- Make the task table itself horizontally scrollable when needed.
- Let users add and remove optional columns from a compact toolbar menu.
- Persist the selected columns in browser local storage.
- Reuse the same preference for root-task and subtask table views.

## Non-Goals

- Introducing a generic table framework for the whole app.
- Per-view column preferences for root tasks versus subtasks.
- Server-side persistence of table preferences.

## Current State

`TasksPage` renders `TaskTableView` for:

- the top-level task list
- the subtask table tab inside a selected task

`TaskTableView` currently renders a fixed set of columns and already wraps the table in a scroll container. The remaining problem is that the table is still sized to fill the container, which makes the page feel like it stretches instead of the table becoming the clear horizontal scroll surface.

## Proposed Approach

### Shared Column Model

Define the task table columns in `TaskTableView` as a local configuration list. Each optional column will have:

- a stable id
- a label
- a default visibility value
- a header renderer
- a cell renderer

The selection checkbox column, the task name column, and the action column remain always visible. These are structural columns and should not disappear.

The following columns become optional:

- Status
- Description
- Blocking
- Blocked by
- Comments
- Created

### Column Picker UI

Add a `Columns` control to the task table toolbar. Clicking it opens a lightweight popover-style menu with checkbox rows for each optional column. Toggling a checkbox updates the visible table columns immediately.

The menu should:

- close on outside click
- close on `Escape`
- reflect current visibility state from storage-backed component state

### Persistence

Persist visible optional columns in local storage using a small utility helper in `src/utils/persistence.ts`. The helper should:

- read a serialized list of column ids
- validate the stored ids against known optional columns
- fall back to the default visible set when the stored value is missing or invalid
- swallow storage access failures so the table still works without persistence

Use one storage key for the shared `TaskTableView` preference so the same column selection applies to root-task and subtask views.

### Layout Behavior

Update the task table layout so the scroll wrapper owns horizontal overflow. The table should be allowed to size itself from its content and visible columns rather than always compressing into the panel width.

This requires:

- keeping the scroll wrapper as the overflow boundary
- removing the full-width forcing that prevents natural table width
- ensuring the table section and relevant flex children can shrink with `min-width: 0`

## Testing Strategy

- Add unit tests for the new persistence helpers, including invalid storage values.
- Add rendering tests for `TaskTableView` column visibility if the current test harness supports it without large setup overhead.
- Run the frontend test suite.
- Verify in the browser that:
  - root-task table scrolls horizontally inside the panel
  - subtask table scrolls horizontally inside the panel
  - column visibility toggles update immediately
  - selected columns survive a reload

## Risks

- Invalid or stale local storage data could hide every optional column unless sanitized.
- Popover state can be brittle if outside-click handling is not cleaned up correctly.
- Table layout changes can unintentionally affect sticky headers or row click behavior.
