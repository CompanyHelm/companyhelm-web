# Settings Export Modal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Settings export selection workflow behind an `Export data` button that opens a modal while preserving the existing export behavior.

**Architecture:** Keep the change local to `SettingsPage.tsx` and its focused render test. Reuse the existing `CreationModal` component and the existing export state/callbacks, adding only local modal open state and moving the export controls into the modal body.

**Tech Stack:** React 18, TypeScript, server-side render tests with `node:test` and `react-dom/server`

---

## Chunk 1: Lock the new Settings export surface

### Task 1: Add failing regression coverage for the modal-trigger export UI

**Files:**
- Modify: `tests/components/settings-page.test.ts`

- [ ] **Step 1: Write the failing test**

Add assertions that:
- the default Settings page markup includes an `Export data` button
- the inline page surface no longer renders preset buttons or export checkboxes when the modal is closed
- an open export modal renders the export presets, section checkboxes, error text, and `Export YAML` button

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/settings-page.test.ts`
Expected: FAIL because `SettingsPage` still renders the export controls inline and does not expose the modal state needed by the new assertions.

### Task 2: Implement the minimal Settings page modal change

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Add local modal state and compact inline export panel**

Add `isExportModalOpen` state and replace the large inline export form with a compact panel that explains the feature and renders a button labeled `Export data`.

- [ ] **Step 2: Render the existing export controls inside a `CreationModal`**

Reuse the current preset buttons, section checkbox list, inline error rendering, and export submit button inside a `CreationModal` titled `Export company data`.

- [ ] **Step 3: Keep request behavior unchanged**

Preserve the existing disabled-state behavior and callbacks for preset application, checkbox toggles, and export submission while the modal is open.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- tests/components/settings-page.test.ts`
Expected: PASS

## Chunk 2: Verify repo impact and finish the branch

### Task 3: Check adjacent verification and e2e impact

**Files:**
- Inspect: `companyhelm-common/tests/system/05-configuration/configuration.spec.ts`

- [ ] **Step 1: Run relevant frontend tests**

Run: `npm test -- tests/components/settings-page.test.ts`
Expected: PASS

- [ ] **Step 2: Inspect shared e2e coverage**

Confirm `companyhelm-common` does not encode the old inline Settings export layout and therefore requires no update for this frontend-only modal move.

- [ ] **Step 3: Commit the implementation**

```bash
git add src/pages/SettingsPage.tsx tests/components/settings-page.test.ts docs/superpowers/plans/2026-03-13-settings-export-modal.md
git commit -m "feat: move settings export into modal"
```

- [ ] **Step 4: Rebase and publish**

```bash
git fetch origin
git rebase origin/main
git push --set-upstream origin codex/export-settings-modal
```

- [ ] **Step 5: Create the PR**

Create a PR against `main` with a body file summarizing:
- the Settings page now exposes an `Export data` button
- the existing export controls moved into a modal
- focused frontend regression coverage was updated
