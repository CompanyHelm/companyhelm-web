# Task Detail Relationship And Subtask Flow Design

## Summary

Keep task relationship editing on `/tasks/:taskId` as a modal and fix the detail-page state so the modal always resolves the current active task. Keep subtask creation on the existing create-task modal and expose it from the task detail actions with `parentTaskId` preset to the current task.

## Goals

- Keep `Edit relationships` on the task detail page instead of navigating away.
- Ensure the relationship modal always opens against the active task on `/tasks/:taskId`.
- Keep the existing create-task modal and reuse it for a semantic `Create subtask` action.
- Preserve the current create flow, including optional dependencies and execute-on-create behavior.

## Non-Goals

- No inline relationships panel rewrite.
- No route-driven modal query params.
- No new subtask entry points beyond existing UI affordances.
- No changes to task mutation contracts or route structure.

## Current State

`TasksRoute` owns the Relay-backed task data and passes adapted props into `TasksPage`. `TasksPage` owns local modal state for the create modal and relationship modal. The detail page already renders an `Edit relationships` button and a `Create subtask` header action, but both depend on local state that should be tied more explicitly to the active detail task.

The task detail page should treat the active route task as the source of truth. Modal open state can remain local, but the selected task for the relationship modal should be derived from the route-backed active task instead of depending on stale selection state.

## Chosen Approach

Use route-derived task resolution for detail-page relationship editing and keep create-subtask as a preset create modal flow.

Why this approach:

- It fixes the bug with the smallest surface area.
- It preserves the existing modal components and mutation flow.
- It avoids adding route complexity for behavior that only needs current-task context.
- It matches the user requirement that relationship editing stay on the same page and subtask creation reuse the existing create modal.

## Detail Page Modal State

The task detail page will continue to own whether the relationship modal is open, but not which task record it should edit when opened from the detail page.

Behavior:

- `Edit relationships` on `/tasks/:taskId` opens the existing `TaskEditModal`.
- When opened from the detail page, the modal task is resolved from `activeTask`.
- Closing the modal clears the open state without changing the current route.
- If the active task disappears, existing route behavior still falls back to the task-not-found state.

This keeps the modal state simple:

- list/table row actions can still open the modal for an explicit task id if needed later
- detail-page actions always edit the route-owned active task

## Create Subtask Flow

The task detail action bar will expose `Create subtask` alongside the existing task actions. Clicking it opens `TaskCreateModal` with `parentTaskId` preset to the current task id.

Behavior:

- the create modal still supports name, description, assignee, status, dependencies, and create-and-execute
- the parent select stays editable inside the modal
- the action is semantic only: it defaults the new task to be a child of the current task, but it does not create a dependency automatically
- top-level create-task behavior remains unchanged

## Component Boundaries

Keep the existing split:

- `TasksRoute`
  - owns route data, mutations, and create-form state
- `TasksPage`
  - owns modal visibility state and detail-page actions
- `TaskCreateModal`
  - remains a presentational create form
- `TaskEditModal`
  - remains the relationship editing modal

The change should stay local to the tasks frontend and should not require API or schema updates.

## Error Handling

- If the user opens detail-page relationship editing with no resolvable active task, do not render the modal.
- If create-task submission fails, preserve the current error banner behavior and keep the modal open.
- If a task disappears while the detail page is open, retain the existing fallback route behavior.

## Testing Strategy

Frontend regression coverage should verify:

- the task detail page renders a create-subtask action for an active task
- the create-subtask action opens the existing create modal with the active task preselected as parent
- the detail-page relationship action opens the relationship modal against the active task
- existing top-level create-task behavior remains unchanged

No API or common e2e changes are expected unless the current system task spec already covers and fails on this flow.
