# Task Detail Relationship And Subtask Flow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep relationship editing on the task detail page via the existing modal and make the detail-page create-subtask action open the existing create-task modal with the current task preset as parent.

**Architecture:** Keep Relay task data ownership in `TasksRoute` and keep modal visibility in `TasksPage`. Fix the detail-page modal wiring by deriving the edit target from the active route task when opened from detail actions, and preserve the existing create modal by driving it with the current task id as the default parent.

**Tech Stack:** React, TypeScript, Relay, Node test runner, Playwright

---

## Chunk 1: Frontend Regression Tests

### Task 1: Add detail-page create-subtask coverage

**Files:**
- Modify: `tests/components/tasks-page.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test that renders `TasksPage` for an active task, triggers the detail-page create-subtask action, and asserts the create modal receives the active task id as `parentTaskId`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/tasks-page.test.ts`
Expected: FAIL because the current test coverage does not assert the preset-parent modal behavior.

- [ ] **Step 3: Write minimal implementation**

Update `TasksPage` modal state so the detail-page create-subtask action opens `TaskCreateModal` with the active task id preset as the parent.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/components/tasks-page.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/components/tasks-page.test.ts src/pages/TasksPage.tsx
git commit -m "test: cover task detail create subtask flow"
```

### Task 2: Add detail-page relationship modal target coverage

**Files:**
- Modify: `tests/components/tasks-page.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test that opens detail-page relationship editing and asserts `TaskEditModal` is bound to the active task rather than stale local selection state.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/tasks-page.test.ts`
Expected: FAIL because the current tests do not cover the active-task modal resolution behavior.

- [ ] **Step 3: Write minimal implementation**

Change `TasksPage` so detail-page relationship editing resolves the modal task from `activeTask` when opened from the detail actions.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/components/tasks-page.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/components/tasks-page.test.ts src/pages/TasksPage.tsx
git commit -m "test: cover task detail relationship modal binding"
```

## Chunk 2: Detail Page Wiring

### Task 3: Refine modal state in `TasksPage`

**Files:**
- Modify: `src/pages/TasksPage.tsx`

- [ ] **Step 1: Write the failing test**

Use the new component tests from Chunk 1 as the red phase for this behavior.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/tasks-page.test.ts`
Expected: FAIL on the new modal-state assertions.

- [ ] **Step 3: Write minimal implementation**

Split modal-open state from modal-target resolution:

- keep `isCreateModalOpen`
- derive the edit modal task from `activeTask` when the detail-page action is used
- keep top-level create-task behavior unchanged
- keep the create modal parent field editable after presetting it

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/components/tasks-page.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/TasksPage.tsx tests/components/tasks-page.test.ts
git commit -m "fix: preserve task detail modal context"
```

## Chunk 3: Verification

### Task 4: Run focused frontend verification

**Files:**
- Modify: none

- [ ] **Step 1: Run focused unit tests**

Run: `npm test -- tests/components/tasks-page.test.ts tests/components/task-edit-modal-thread.test.ts tests/tasks/task-relay-adapters.test.ts`
Expected: PASS

- [ ] **Step 2: Run frontend build or repo verification command**

Run: `npm test`
Expected: PASS or a documented unrelated failure

- [ ] **Step 3: Run relevant shared e2e coverage check**

Inspect `companyhelm-common/tests/system/06-tasks/tasks.spec.ts` and run the frontend-only verification path unless this flow requires a system spec update.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: verify task detail modal flow"
```

## Chunk 4: Integration

### Task 5: Prepare branch and PR

**Files:**
- Modify: none

- [ ] **Step 1: Sync with latest main**

Run: `git fetch origin main && git rebase origin/main`
Expected: branch rebased cleanly

- [ ] **Step 2: Push branch**

Run: `git push --set-upstream origin <branch-name>`
Expected: branch published

- [ ] **Step 3: Create PR**

Run: `gh pr create --title "<title>" --body-file <path>`
Expected: PR URL returned

- [ ] **Step 4: Monitor checks**

Run: `gh pr checks <pr-number> --watch`
Expected: all checks pass or failures are fixed and re-pushed

Plan complete and saved to `docs/superpowers/plans/2026-03-13-task-detail-relationship-subtask-flow.md`. Ready to execute?
