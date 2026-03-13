# Archived Chat Batch Delete Design

## Summary

Add checkbox-based multi-select and batch permanent delete for archived chats in:

- the single-agent archived chats list on `AgentChatsPage`
- the multi-agent archived chats overview on `ChatsOverviewPage`

The feature should allow users to select individual archived chats, select all visible archived chats, clear selection with an explicit `Deselect all` action, and permanently delete the selection through one bulk confirmation dialog.

## Current Problem

Archived chat pages currently only support permanent deletion one row at a time. This is slow when users need to clean up many archived chats and forces repeated confirmation flows for a task that is naturally batch-oriented.

## Approved Behavior

- Archived chat rows render a checkbox for selection.
- Archived-mode toolbars render:
  - a master `Select all` checkbox
  - a selected-count label
  - a `Deselect all` action
  - a `Delete selected` action
- On `ChatsOverviewPage`, `Select all` applies to all visible archived chats across every agent section on the page.
- On `AgentChatsPage`, `Select all` applies to the archived chats visible in that page's list.
- Users can mix `Select all` with individual row toggles to keep or remove specific chats from the selection.
- `Delete selected` opens one confirmation dialog that references the number of selected chats.
- Bulk deletion continues when an individual delete fails.
- After a bulk delete attempt:
  - successfully deleted chats are removed from the rendered lists
  - successfully deleted chats are removed from selection
  - failed chats remain selected
  - the UI shows one summary error when any deletions fail

## Design

### Shared Selection Model

Keep selection state local to each page component, but use shared helper utilities for the common mechanics:

- generating a stable selected-chat key from `agentId` and `sessionId`
- toggling one selected chat
- toggling all visible archived chats
- pruning selection after successful deletions
- computing toolbar state such as `all selected` and selected count

This keeps behavior aligned between the two archived chat surfaces without introducing page-specific copies of the same selection rules.

### Page Integration

`AgentChatsPage` and `ChatsOverviewPage` should only enable this selection UI when the normalized chat list filter is `archived`.

In archived mode:

- each archived row gets a leading checkbox
- row clicks continue to open the chat when the user interacts with the row body
- checkbox clicks must not trigger row navigation
- the existing per-row delete action remains available

In active mode:

- no row checkboxes render
- no batch toolbar renders
- current archive/delete/create behavior remains unchanged

### Bulk Delete Flow

Use the existing page-level delete callback and extend it with a `skipConfirmation` option for batch execution. Bulk delete should not introduce a separate mutation path.

Flow:

1. Gather the selected archived chats visible in the current page.
2. Open one danger confirmation modal with copy based on the selected count.
3. After confirmation, execute deletions sequentially through the existing delete handler with `skipConfirmation: true`.
4. Collect successful and failed deletions.
5. Allow the existing delete handling to update in-memory chat state for each successful delete.
6. Clear selection for successful deletes and keep failed chats selected.
7. Show one summary error when any deletes fail, for example `3 chats deleted, 2 failed.`

Sequential execution is acceptable for this first version because the schema does not currently expose a batch chat delete mutation and the goal is to ship the UX with minimal API surface changes.

### Error Handling

- If no chats are selected, `Delete selected` stays disabled.
- If a bulk delete is already running, selection controls and the bulk action should be disabled to avoid duplicate requests.
- Partial failures should not roll back successful deletions.
- The summary error should describe the aggregate result instead of raising one modal per failed chat.

### Accessibility And UI

- Master and row checkboxes must have explicit accessible labels.
- The toolbar should expose selection state in readable text, such as `4 selected`.
- `Deselect all` should always clear the page-local selection, including rows that remained selected after failures.
- Bulk confirmation should use the existing danger confirmation modal styling.

### Testing

Add focused frontend tests for both archived pages that verify:

- archived mode renders row checkboxes and the batch toolbar
- active mode does not render batch-selection UI
- `Select all` selects all visible archived chats
- individual checkbox toggles update the selected count
- `Deselect all` clears selection
- bulk delete opens one confirmation dialog
- successful bulk delete clears selection for deleted chats
- partial failure keeps failed chats selected and surfaces one summary error

## Non-Goals

- No new GraphQL schema or batch chat delete mutation in this change
- No changes to non-archived chat deletion behavior beyond adding the optional `skipConfirmation` path used internally by batch delete
- No change to archive behavior or chat creation behavior
