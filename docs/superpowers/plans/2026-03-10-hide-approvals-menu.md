# Hide Approvals Menu Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the `Approvals` side-menu entry without breaking direct `/approvals` routing or existing internal navigation.

**Architecture:** Keep `approvals` in the route-aware navigation source inside `src/utils/constants.ts`, but exclude it from the exported `NAV_SECTIONS` used by the visible side menu. Reuse the existing hidden-item pattern already used for `secrets` so the change stays localized and low-risk.

**Tech Stack:** React, TypeScript, Vite, Node test runner (`npm test`)

---

## Chunk 1: Lock in regression coverage

### Task 1: Add the menu-vs-route test

**Files:**
- Modify: `tests/utils/constants.test.ts`

- [ ] **Step 1: Write the failing test**

Add assertions that:
- visible menu sections do not include an item with `id === "approvals"`
- `PAGE_IDS` still includes `approvals`

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm test -- tests/utils/constants.test.ts`
Expected: FAIL because `approvals` is still visible in `NAV_SECTIONS`

## Chunk 2: Implement the navigation change

### Task 2: Hide approvals from the visible menu only

**Files:**
- Modify: `src/utils/constants.ts`
- Modify: `tests/utils/constants.test.ts`

- [ ] **Step 1: Write the minimal implementation**

Update the exported `NAV_SECTIONS` filter so the visible menu excludes both `secrets` and `approvals`, while `ROUTABLE_NAV_SECTIONS`, `NAV_ITEMS`, and `PAGE_IDS` still include `approvals`.

- [ ] **Step 2: Run the targeted test to verify it passes**

Run: `npm test -- tests/utils/constants.test.ts`
Expected: PASS

- [ ] **Step 3: Run the broader frontend verification**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Build the frontend**

Run: `npm run build`
Expected: PASS

## Chunk 3: Prepare review and integration

### Task 3: Review, sync, and open PR

**Files:**
- Modify: none expected unless review or CI finds issues

- [ ] **Step 1: Check whether shared e2e coverage needs changes**

Inspect `companyhelm-common` e2e coverage for menu assumptions about approvals.
Expected: likely no e2e changes for a frontend-only hidden nav item

- [ ] **Step 2: Sync with latest main**

Run: `git fetch origin && git rebase origin/main`
Expected: rebase completes without conflicts

- [ ] **Step 3: Create the commit**

Run:
```bash
git add src/utils/constants.ts tests/utils/constants.test.ts docs/superpowers/specs/2026-03-10-hide-approvals-menu-design.md docs/superpowers/plans/2026-03-10-hide-approvals-menu.md
git commit -m "feat: hide approvals from side menu"
```

- [ ] **Step 4: Push and open PR**

Run:
```bash
git push -u origin <branch-name>
gh pr create --title "feat: hide approvals from side menu" --body-file <prepared-body-file>
```

- [ ] **Step 5: Wait for checks**

Run: `gh pr checks <pr-number> --watch`
Expected: all checks pass before reporting completion
