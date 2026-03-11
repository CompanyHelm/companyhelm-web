# Reorganize Left Menu Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the frontend left menu into clearer product-domain sections without changing routes or page availability.

**Architecture:** Keep the change localized to the shared navigation constants in `src/utils/constants.ts`, because the side menu already renders from `NAV_SECTIONS` in `src/App.tsx`. Lock the new information architecture in place with targeted assertions in `tests/utils/constants.test.ts` so label, section, and ordering regressions are caught cheaply.

**Tech Stack:** React, TypeScript, Vite, Node test runner (`npm test`)

---

## Chunk 1: Lock in the new information architecture

### Task 1: Add regression coverage for section labels and ordering

**Files:**
- Modify: `tests/utils/constants.test.ts`

- [ ] **Step 1: Write the failing test**

Add assertions that the visible sections exported by `NAV_SECTIONS` are exactly:
- `Workspace`
- `AI Studio`
- `Platform`

Add assertions that the item ids in each section are exactly:
- `Workspace`: `dashboard`, `tasks`, `chats`
- `AI Studio`: `agents`, `skills`, `skill-groups`, `roles`
- `Platform`: `agent-runner`, `mcp-servers`, `gitskillpackages`, `repos`, `secrets`

Keep the existing assertion that `approvals` is hidden from visible navigation but still present in `PAGE_IDS`.

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm test -- tests/utils/constants.test.ts`
Expected: FAIL because the existing section labels and item membership do not match the new grouping

## Chunk 2: Implement the new grouping

### Task 2: Update the exported navigation sections

**Files:**
- Modify: `src/utils/constants.ts`
- Modify: `tests/utils/constants.test.ts`

- [ ] **Step 1: Write the minimal implementation**

Update `ROUTABLE_NAV_SECTIONS` and the exported visible `NAV_SECTIONS` structure so the menu renders:
- `Workspace` with `dashboard`, `tasks`, `chats`
- `AI Studio` with `agents`, `skills`, `skill-groups`, `roles`
- `Platform` with `agent-runner`, `mcp-servers`, `gitskillpackages`, `repos`, `secrets`

Keep `approvals` available for routing but filtered from the visible menu.

- [ ] **Step 2: Run the targeted test to verify it passes**

Run: `npm test -- tests/utils/constants.test.ts`
Expected: PASS

- [ ] **Step 3: Run broader frontend verification**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Build the frontend**

Run: `npm run build`
Expected: PASS

## Chunk 3: Validate integration and prepare review

### Task 3: Confirm downstream impact, sync, and open PR

**Files:**
- Modify: none expected unless review or CI surfaces issues

- [ ] **Step 1: Check whether shared e2e coverage needs updates**

Inspect `companyhelm-common` e2e coverage for assumptions about left-menu section labels or ordering.
Expected: likely no e2e changes for a frontend-only navigation regrouping, but confirm explicitly

- [ ] **Step 2: Sync with latest main**

Run: `git fetch origin && git rebase origin/main`
Expected: rebase completes without conflicts

- [ ] **Step 3: Create the commit**

Run:
```bash
git add src/utils/constants.ts tests/utils/constants.test.ts docs/superpowers/specs/2026-03-11-reorganize-left-menu-design.md docs/superpowers/plans/2026-03-11-reorganize-left-menu.md
git commit -m "feat: reorganize left menu sections"
```

- [ ] **Step 4: Push and open PR**

Run:
```bash
git push -u origin <branch-name>
gh pr create --title "feat: reorganize left menu sections" --body-file <prepared-body-file>
```

- [ ] **Step 5: Wait for checks**

Run: `gh pr checks <pr-number> --watch`
Expected: all checks pass before reporting completion
