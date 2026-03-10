# Hide Secrets Menu Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the `Secrets` side-menu entry for all users without breaking direct `/secrets` routing or existing internal navigation.

**Architecture:** Split visible menu navigation from routable page metadata inside `src/utils/constants.ts`. Keep the side menu rendering based on visible sections, while route/path helpers continue to rely on a route-aware item list that still includes `secrets`.

**Tech Stack:** React, TypeScript, Vite, Node test runner (`tsx --test`)

---

## Chunk 1: Lock in regression coverage

### Task 1: Add menu-vs-route utility tests

**Files:**
- Modify: `tests/utils/constants.test.ts`
- Modify: `tests/utils/path.test.ts`

- [ ] **Step 1: Write the failing tests**

Add assertions that:
- visible menu sections do not include an item with `id === "secrets"`
- `/secrets` still resolves to the `secrets` page
- `getPathForPage("secrets")` still returns `/secrets`

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npm test -- tests/utils/constants.test.ts tests/utils/path.test.ts`
Expected: FAIL because the current constants expose `secrets` in the visible menu and the new assertions are not yet satisfied.

- [ ] **Step 3: Commit the red test state only if the repo workflow requires it**

Run:
```bash
git add tests/utils/constants.test.ts tests/utils/path.test.ts
git commit -m "test: cover hidden secrets menu routing"
```

Expected: In normal flow, skip this commit and continue to implementation in the same working tree.

## Chunk 2: Implement the navigation split

### Task 2: Separate visible navigation from routable pages

**Files:**
- Modify: `src/utils/constants.ts`

- [ ] **Step 1: Introduce a route-aware navigation source**

Keep `secrets` in the data used to build `NAV_ITEMS` and `PAGE_IDS`, but exclude it from the exported `NAV_SECTIONS` used by the side menu.

- [ ] **Step 2: Preserve existing path-helper behavior**

Make sure the exported `NAV_ITEMS`, `PRIMARY_NAV_ITEMS`, and `PAGE_IDS` still include `secrets`, so `getPageFromPathname("/secrets")` and `getPathForPage("secrets")` continue to work without touching `src/utils/path.ts`.

- [ ] **Step 3: Run the targeted tests to verify they pass**

Run: `npm test -- tests/utils/constants.test.ts tests/utils/path.test.ts`
Expected: PASS

- [ ] **Step 4: Run the broader frontend verification**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Build the frontend**

Run: `npm run build`
Expected: production build completes successfully

- [ ] **Step 6: Commit the implementation**

Run:
```bash
git add src/utils/constants.ts tests/utils/constants.test.ts tests/utils/path.test.ts docs/superpowers/specs/2026-03-10-hide-secrets-menu-design.md docs/superpowers/plans/2026-03-10-hide-secrets-menu.md
git commit -m "feat: hide secrets from side menu"
```

Expected: commit recorded on the feature branch with tests already passing

## Chunk 3: Integration and PR

### Task 3: Prepare the branch for review

**Files:**
- Modify: none required unless rebase or CI fixes uncover issues

- [ ] **Step 1: Sync with the latest main branch**

Run:
```bash
git fetch origin
git rebase origin/main
```

Expected: branch is rebased cleanly with no conflicts

- [ ] **Step 2: Push the branch**

Run: `git push -u origin <branch-name>`
Expected: remote branch created or updated

- [ ] **Step 3: Open the pull request**

Run:
```bash
gh pr create --title "feat: hide secrets from side menu" --body-file <prepared-body-file>
```

Expected: PR URL returned

- [ ] **Step 4: Wait for checks and fix anything they catch**

Run:
```bash
gh pr checks <pr-number> --watch
```

Expected: all checks pass before reporting completion
