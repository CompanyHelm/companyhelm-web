# Task Relay Slice Migration Design

## Summary

Migrate the tasks route to a task-specific Relay slice instead of continuing to load and mutate task state through `App.tsx` local state and ad hoc GraphQL helpers. Keep the visible tasks UI unchanged for the first pass. Add a task-specific subscription in `companyhelm-api` so the tasks page becomes Relay-backed for queries, mutations, and live updates.

This migration is intentionally bounded to the tasks domain. It does not introduce a generic entity event framework and it does not attempt to migrate unrelated routes at the same time.

## Goals

- Move `/tasks` and `/tasks/:taskId` to Relay query and fragment ownership.
- Replace manual task page reloads in the frontend with Relay-normalized task records.
- Add a task-specific GraphQL subscription that publishes task and task comment changes relevant to the tasks page.
- Keep the existing tasks UI behavior and routing model intact during the migration.

## Non-Goals

- No generic cross-domain event bus or reusable entity subscription framework.
- No broad Relay migration for the rest of the app.
- No visual redesign of the tasks page.
- No retro-compatibility work for an old task state layer beyond what is needed to remove it from the tasks route.

## Current State

The frontend already has a Relay runtime environment and a manual GraphQL-over-WebSocket subscription helper, but the tasks route is still owned by `App.tsx` state. The tasks page currently depends on:

- `LIST_TASK_PAGE_TASKS_QUERY`
- `LIST_TASK_OPTIONS_QUERY`
- `LIST_TASK_ASSIGNABLE_PRINCIPALS_QUERY`
- task mutations invoked from `App.tsx`
- manual reloads of task page data after mutations

The API already exposes task queries and task mutations, but it does not expose a task-specific subscription. Existing subscriptions follow a pattern where the subscription resolver re-runs a concrete query rather than returning a generic event envelope.

## Chosen Approach

Use a task-specific Relay slice.

Why this approach:

- It matches how Relay expects concrete GraphQL records and stable ids.
- It keeps scope bounded to one domain and one route.
- It reuses the API's existing subscription pattern.
- It avoids introducing generic event decoding and manual store orchestration before proving the tasks migration.

## Route Architecture

Introduce a Relay route container for both `/tasks` and `/tasks/:taskId`.

The route container owns:

- route params
- query loading
- task page subscription lifecycle
- task mutations
- targeted refetch when list membership changes

The route will load one task slice with route-driven variables:

- `topLevelOnly`
- `rootTaskId`
- `maxDepth`

Route behavior:

- `/tasks`
  - load top-level tasks
- `/tasks/:taskId`
  - load the rooted subtree for that task
- visible depth remains a route-owned UI input that drives query variables for the task slice

## Query Tree

The tasks route query should load all data needed by the page shell:

- task slice for the current route
- task options for relationship pickers and hierarchy lookup
- task-assignable principals
- agents needed for execute fallback and assignment UI

Preferred GraphQL shape:

- add a task connection field for the Relay-owned task slice
- keep `taskOptions` as a simple list
- keep `taskAssignablePrincipals` as a simple list

The task slice should not remain a plain list if the route is being migrated to Relay as the primary owner. A connection shape is better aligned with Relay for list membership changes, deletion handling, and future pagination if needed.

## Fragment Boundaries

Initial ownership boundaries:

- `TasksRouteQuery`
  - route-level query
- `TasksPage_query`
  - page-level fragment that reads the task slice, task options, principals, and agents
- `TaskDetail_task`
  - active task overview, comments, assignee, status, thread link

Later optional splits, if useful during implementation:

- `TaskTableRow_task`
- `TaskGraphNode_task`
- `TaskCommentList_task`
- `TaskEditModal_task`

The first pass should prefer a small number of fragments and an adapter layer that preserves the existing presentational component props. The goal is to change data ownership first, not to rewrite the entire tasks UI tree at the same time.

## Subscription Design

Add a task-specific subscription in `companyhelm-api`:

- `tasksUpdated(topLevelOnly, rootTaskId, maxDepth): TasksUpdatedPayload!`

Payload shape:

- `tasks: [Task!]!`
- `deletedTaskIds: [ID!]!`
- `membershipChanged: Boolean!`

Rationale:

- `tasks` lets Relay normalize real `Task` records by id.
- `deletedTaskIds` handles removals cleanly.
- `membershipChanged` covers cases where the visible slice membership changes and a route refetch is safer than only patching records.

Events that should publish `tasksUpdated`:

- create task
- delete task
- batch delete tasks
- set task parent
- add task dependency
- remove task dependency
- set task assignee principal
- set task status
- execute task and batch execute tasks when task rows change
- create task comment
- non-GraphQL backend task or comment writes that affect the tasks page

Filtering should remain company-scoped and route-slice-aware. The subscription should follow the existing API pattern: subscribe to a scoped event stream, then resolve by loading the concrete task slice for the provided arguments.

## Mutation Contract Changes

To work well with Relay normalization, task mutations should return hydrated task data whenever possible.

Desired behavior:

- create and execute mutations return updated `Task` nodes
- relationship mutations return the affected `Task` node instead of `task: null`
- comment mutation returns either the updated owning `Task` or enough task-scoped payload to update the owner without a full manual reload
- delete mutations return deleted ids

The API already has concrete `Task` and `TaskComment` types, so this is a contract cleanup rather than a schema redesign.

## Store Update Rules

Use Relay normalization by default.

Expected handling:

- field-only updates on an existing visible task
  - accept normalized task payloads directly
- comment additions on an existing visible task
  - normalize onto the owning task record if the mutation/subscription returns the task
- deletions
  - remove deleted ids from the store
- membership-changing operations
  - trigger route refetch when `membershipChanged` is true

This avoids building custom client-side task reconciliation logic in parallel with Relay.

## Frontend Component Boundaries

Keep the current tasks UI components as presentational components where possible:

- `TasksPage`
- `TaskTableView`
- `TaskGraphView`
- `TaskCreateModal`
- `TaskEditModal`

Add new data-owning wrappers or hooks around them instead of pushing Relay concerns into every existing component immediately.

Primary new ownership points:

- route container
- task query adapter
- task mutation hooks
- task subscription hook

This keeps the migration bounded and lowers the risk of UI regressions.

## API Component Boundaries

Backend work should stay local to the task GraphQL surface:

- schema additions for `tasksUpdated` and its payload type
- subscription event emitter additions for task events
- subscription resolver that resolves a concrete task slice
- mutation publish calls for task and task comment changes
- any shared task-loading helpers needed so query and subscription resolution reuse the same logic

No generic event abstraction should be introduced in this migration.

## Error Handling

Frontend:

- route query errors should surface through the existing tasks page error path
- mutation errors should remain task-scoped and preserve current UX
- subscription failures should not blank the page; they should surface a recoverable error and allow explicit refetch

API:

- unauthenticated or out-of-scope subscription requests should fail consistently with existing subscription auth behavior
- task subscription resolution should validate company scope before loading task data

## Testing Strategy

Frontend tests:

- add coverage for the task route query adapter and task subscription handling
- verify that task membership-changing subscription payloads trigger a route refetch
- verify that non-membership updates patch visible task records without a full manual reload

API tests:

- add schema-level coverage for `tasksUpdated`
- verify company scoping and resolver behavior
- verify publish paths for task mutations and task comment creation

System tests:

- check `companyhelm-common/tests/system/06-tasks/tasks.spec.ts`
- extend it only if the migration changes observable behavior or introduces a realtime scenario that should be locked in

## Risks

- The current task query is list-based, while Relay works best with more explicit connection ownership.
- Several task mutations currently return partial or null task payloads, which will force unnecessary refetches if left unchanged.
- The tasks page has significant derived state in `App.tsx`; moving ownership without changing behavior requires a careful adapter layer.

## Rollout Notes

This should ship as one bounded migration for the tasks route and its paired API surface. The rest of the application can continue using its current GraphQL access patterns until later migrations are planned separately.
