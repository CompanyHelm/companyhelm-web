# Settings Companies Tab Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Companies` tab inside Settings that lists accessible companies, moves company creation behind a visible `Create company` button, and adds typed-name confirmation for deleting any listed company.

**Architecture:** Keep the feature local to the existing frontend settings surface. `App.tsx` continues to own the company list and create/delete mutations, while `SettingsPage.tsx` adds local tab and delete-modal state and renders the company-management UI. Reuse the existing create-company modal and current company-loading reconciliation instead of adding routes or backend changes.

**Tech Stack:** React 18, TypeScript, server-side render tests with `node:test` and `react-dom/server`

---

## Chunk 1: Lock the new Settings surface with focused render tests

### Task 1: Expand `SettingsPage` test inputs for the new company-management UI

**Files:**
- Modify: `tests/components/settings-page.test.ts`

- [ ] **Step 1: Write the failing tests**

Add render coverage that asserts:
- `SettingsPage` shows `General` and `Companies` tabs
- the default render does not include the old `aria-label="Create company"` header icon button
- the default `General` tab still shows the export panel
- the `Companies` tab render shows a visible `Create company` button, company rows, and row delete actions
- an open delete-confirmation modal shows the target company name, the typed confirmation input, and a disabled delete button before the name matches

- [ ] **Step 2: Run the focused test file to verify it fails**

Run: `npm test -- tests/components/settings-page.test.ts`
Expected: FAIL because `SettingsPage` does not yet render tabs, company rows, or the typed delete confirmation modal.

### Task 2: Add minimal `SettingsPage` props needed for deterministic render tests

**Files:**
- Modify: `src/pages/SettingsPage.tsx`
- Modify: `tests/components/settings-page.test.ts`

- [ ] **Step 1: Add prop inputs for company list and test-controlled initial UI state**

Extend `SettingsPageProps` to accept:
- `companies`
- a row-targeted delete callback
- optional initial active tab
- optional initial delete-target company id

Use these props only to support the real feature and deterministic server-render tests.

- [ ] **Step 2: Re-run the focused test file**

Run: `npm test -- tests/components/settings-page.test.ts`
Expected: FAIL, but with prop/type issues resolved and assertions now failing on missing UI.

## Chunk 2: Implement the Settings page tabs and local delete-confirmation UI

### Task 3: Add `General` and `Companies` tabs inside `SettingsPage`

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Add local tab state**

Default to `General`, and render a small tab strip with:
- `General`
- `Companies`

- [ ] **Step 2: Move Settings content behind the tabs**

Keep export in `General`. Remove the header create-company icon action entirely. Remove the old danger-zone delete section from `General`.

- [ ] **Step 3: Add the `Companies` tab surface**

Render:
- explanatory copy
- a `Create company` button that opens the existing create-company modal
- the accessible company list
- a delete button for each listed company

- [ ] **Step 4: Add the local typed delete-confirmation modal**

Implement a dedicated modal in `SettingsPage` rather than extending the app-wide `ConfirmationModal`, because this flow requires an input field. The modal should:
- identify the target company
- explain the destructive scope
- render an input for the exact company name
- disable delete until the input exactly matches

- [ ] **Step 5: Re-run the focused render tests**

Run: `npm test -- tests/components/settings-page.test.ts`
Expected: PASS for the new Settings surface coverage.

## Chunk 3: Wire row-targeted delete behavior through `App.tsx`

### Task 4: Change company deletion from active-company-only to row-targeted

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Update the delete handler signature**

Change `handleDeleteCompany` to accept the target company object or its `id` and `name`, instead of reading only `selectedCompany`.

- [ ] **Step 2: Keep mutation and reconciliation behavior aligned**

After delete succeeds:
- call the existing delete mutation with the targeted company id
- reload companies with `loadCompanies()`
- rely on the existing `loadCompanies()` reconciliation logic to preserve the selected company when still present or fall back to the first accessible company when the active one was deleted

- [ ] **Step 3: Keep user-visible errors coherent**

If no target company is provided, surface a company error. If the mutation fails, keep the existing error banner behavior so the failure stays visible on Settings.

- [ ] **Step 4: Re-run the focused Settings test file**

Run: `npm test -- tests/components/settings-page.test.ts`
Expected: PASS

## Chunk 4: Verify repo impact and finish the branch

### Task 5: Check nearby shared e2e expectations and run verification

**Files:**
- Inspect: `companyhelm-common`

- [ ] **Step 1: Run the frontend test file again after all edits**

Run: `npm test -- tests/components/settings-page.test.ts`
Expected: PASS

- [ ] **Step 2: Run the broader frontend test suite if the Settings changes touch shared primitives unexpectedly**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Inspect `companyhelm-common` for Settings-layout e2e coupling**

Look for Settings or company-management expectations that would break because:
- create-company moved from a header icon to the `Companies` tab
- delete-company moved out of the main Settings tab

Only update shared e2e coverage if there is a real expectation encoded there.

- [ ] **Step 4: Commit the implementation**

```bash
git add src/App.tsx src/pages/SettingsPage.tsx tests/components/settings-page.test.ts docs/superpowers/plans/2026-03-13-settings-companies-tab.md
git commit -m "feat: add settings companies tab"
```

- [ ] **Step 5: Rebase, push, and open the PR**

```bash
git fetch origin
git rebase origin/main
git push --set-upstream origin codex/settings-companies-tab
```

Create a PR against `main` summarizing:
- Settings now has `General` and `Companies` tabs
- company creation moved to the `Companies` tab
- company deletion is row-targeted and requires typing the company name
- focused frontend coverage was updated
