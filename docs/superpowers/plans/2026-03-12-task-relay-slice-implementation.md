# Task Relay Slice Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the tasks route to Relay-generated query/fragment/mutation/subscription ownership and add a task-specific API subscription that keeps the page live without the old `App.tsx` task loader.

**Architecture:** Add Relay compiler support in `frontend`, build a dedicated tasks route container that adapts Relay data into the existing `TasksPage` UI, and add a `tasksUpdated` GraphQL subscription in `companyhelm-api`. Keep the visible tasks UI unchanged while shifting task data ownership out of `App.tsx`.

**Tech Stack:** React 18, react-relay, relay-runtime, relay-compiler, Vite, GraphQL, Mercurius, Vitest, Node test runner

---

## Chunk 1: API Relay-Friendly Task Subscription

### Task 1: Add schema coverage for the new task subscription contract

**Files:**
- Modify: `companyhelm-api/tests/graphql.task-schema.test.ts`
- Modify: `companyhelm-api/tests/graphql.subscription.resolver.test.ts`

- [ ] **Step 1: Write the failing schema tests**

Add assertions for:
- `Subscription.tasksUpdated`
- `TasksUpdatedPayload`
- `deletedTaskIds`
- `membershipChanged`

Add subscription resolver expectations for:
- `subscribeTasksUpdated(companyId)`
- `queryResolvers.tasks(...)` usage during resolve

- [ ] **Step 2: Run API tests to verify they fail**

Run: `npm test -- tests/graphql.task-schema.test.ts tests/graphql.subscription.resolver.test.ts`
Expected: FAIL because `tasksUpdated` does not exist yet.

- [ ] **Step 3: Implement the schema and resolver surface**

Modify:
- `companyhelm-api/src/graphql/schemas/schema.ts`
- `companyhelm-api/schema/schema.graphql`
- `companyhelm-api/src/graphql/schemas/subscription.ts`
- `companyhelm-api/src/graphql/schemas/subscription-events.ts`

Add:
- `TasksUpdatedPayload`
- `Subscription.tasksUpdated(topLevelOnly, rootTaskId, maxDepth)`
- event emitter subscribe/publish helpers for task updates
- subscription resolver that re-runs the concrete task slice query for the subscriber scope

- [ ] **Step 4: Regenerate resolver types and schema artifacts**

Run:
- `npm run codegen`
- `npm run graphql-schema:build`

Expected: generated resolver types and committed schema snapshots include `tasksUpdated`.

- [ ] **Step 5: Re-run API schema tests**

Run: `npm test -- tests/graphql.task-schema.test.ts tests/graphql.subscription.resolver.test.ts`
Expected: PASS

### Task 2: Publish task update events from task writes

**Files:**
- Modify: `companyhelm-api/src/graphql/schemas/mutation.ts`
- Modify: `companyhelm-api/src/graphql/schemas/query.ts`
- Modify: `companyhelm-api/tests/graphql.task.resolver.test.ts`

- [ ] **Step 1: Write the failing mutation publish-path tests**

Add tests that verify:
- `createTask` publishes membership-changing updates
- `createTaskComment` publishes non-membership updates
- `setTaskParent`, `addTaskDependency`, `removeTaskDependency`, `deleteTask`, `batchDeleteTasks`, `setTaskStatus`, `setTaskAssigneePrincipal`, `executeTask`, and `batchExecuteTasks` publish task updates

- [ ] **Step 2: Run API resolver tests to verify they fail**

Run: `npm test -- tests/graphql.task.resolver.test.ts`
Expected: FAIL because publish hooks are not called.

- [ ] **Step 3: Implement publish calls with bounded semantics**

Add publish helpers in mutation paths with:
- `membershipChanged: true` for create/delete/reparent/dependency edits
- `membershipChanged: false` for status, assignee, execute, and comment updates
- `deletedTaskIds` populated for delete operations

Keep task loading logic in `query.ts` reusable so `tasksUpdated.resolve` can return the current slice.

- [ ] **Step 4: Re-run API resolver tests**

Run: `npm test -- tests/graphql.task.resolver.test.ts`
Expected: PASS

- [ ] **Step 5: Run targeted API verification**

Run:
- `npm test -- tests/graphql.task-schema.test.ts tests/graphql.subscription.resolver.test.ts tests/graphql.task.resolver.test.ts`
- `npm run typecheck`

Expected: PASS

## Chunk 2: Frontend Relay Tasks Route

### Task 3: Add Relay compiler support and generated task operations

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/vite.config.ts`
- Create: `frontend/relay.config.json`
- Create: `frontend/src/tasks/relay/TasksRouteQuery.tsx`
- Create: `frontend/src/tasks/relay/TaskMutations.ts`
- Create: `frontend/src/tasks/relay/TasksUpdatedSubscription.ts`

- [ ] **Step 1: Write the failing frontend test for the Relay tasks route shell**

Create a focused test file for the route container shape, for example:
- `frontend/tests/components/tasks-relay-route.test.tsx`

Cover:
- loading Relay-backed task data into existing `TasksPage`
- subscription-driven refetch trigger on membership changes
- unchanged tasks UI rendering from adapted Relay data

- [ ] **Step 2: Run the new frontend test to verify it fails**

Run: `npm test -- tests/components/tasks-relay-route.test.tsx`
Expected: FAIL because the route container and generated operations do not exist.

- [ ] **Step 3: Add compiler support and compile task artifacts**

Implement:
- Relay Babel transform in `vite.config.ts`
- compiler config in `relay.config.json`
- npm scripts for relay compilation if missing
- task query, fragment, mutation, and subscription definitions using `graphql`

Run:
- `npx relay-compiler`

Expected: generated `__generated__` artifacts appear for the new tasks operations.

- [ ] **Step 4: Build the Relay tasks route container**

Implement a route-owned container that:
- loads the task slice, task options, assignable principals, and agents via Relay
- adapts Relay nodes to the existing `TaskItem`, `Principal`, and `Agent` view-model shapes
- owns local form state and relationship drafts for the tasks page
- commits Relay mutations for task writes
- subscribes to `tasksUpdated`
- refetches on `membershipChanged`

Prefer new files under:
- `frontend/src/tasks/relay/`
- `frontend/src/tasks/utils/`

- [ ] **Step 5: Re-run the new frontend test**

Run: `npm test -- tests/components/tasks-relay-route.test.tsx`
Expected: PASS

### Task 4: Cut the tasks route over from App state to Relay state

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/tests/components/tasks-page.test.ts`
- Check: `companyhelm-common/tests/system/06-tasks/tasks.spec.ts`

- [ ] **Step 1: Write the failing integration-oriented frontend assertions**

Add or update tests that prove:
- `App.tsx` renders the Relay-backed tasks route instead of the old state-driven `TasksPage` branch
- the tasks page no longer triggers the old task page loader path when `activePage === "tasks"`

- [ ] **Step 2: Run the targeted frontend tests to verify they fail**

Run:
- `npm test -- tests/components/tasks-relay-route.test.tsx tests/components/tasks-page.test.ts`

Expected: FAIL because `App.tsx` still renders the legacy task branch.

- [ ] **Step 3: Replace the legacy route branch with the Relay route**

Modify `frontend/src/App.tsx` to:
- render the new tasks Relay route component
- stop invoking the legacy task page data loader for the tasks route
- keep dashboard/profile task loading intact
- preserve routing callbacks (`/tasks`, `/tasks/:taskId`) and task thread opening behavior

Review `companyhelm-common/tests/system/06-tasks/tasks.spec.ts` and update only if the route cutover changes observable behavior.

- [ ] **Step 4: Re-run targeted frontend verification**

Run:
- `npm test -- tests/components/tasks-relay-route.test.tsx tests/components/tasks-page.test.ts`
- `npm test`

Expected: PASS

## Chunk 3: Cross-Repo Verification

### Task 5: Verify the paired frontend and API changes together

**Files:**
- Check only: `companyhelm-common/tests/system/06-tasks/tasks.spec.ts`

- [ ] **Step 1: Run targeted repo tests**

Run:
- `npm test -- tests/graphql.task-schema.test.ts tests/graphql.subscription.resolver.test.ts tests/graphql.task.resolver.test.ts` in `companyhelm-api`
- `npm test -- tests/components/tasks-relay-route.test.tsx tests/components/tasks-page.test.ts` in `frontend`

Expected: PASS

- [ ] **Step 2: Run full relevant repo suites**

Run:
- `npm test` in `companyhelm-api`
- `npm test` in `frontend`

Expected: PASS

- [ ] **Step 3: Smoke the tasks route manually if service startup is needed**

Run the relevant local service commands for the changed repos and verify the tasks route loads and the subscription path connects cleanly.

- [ ] **Step 4: Prepare branch completion**

After all checks pass:
- commit logical frontend and API changes
- create PRs
- include test evidence and note whether `companyhelm-common/tests/system/06-tasks/tasks.spec.ts` needed updates
