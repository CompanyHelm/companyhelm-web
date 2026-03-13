# Skills Browser Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the Skills page into a pure skills browser with no role-management UI and no role summary in skill detail.

**Architecture:** Keep the existing `SkillsPage` route and skill detail flow, but collapse the landing view into a flat skills list. Remove page actions and role-specific presentation from the page rather than introducing new routing or state.

**Tech Stack:** TypeScript, React, node:test

---

## Chunk 1: Test First For The Simplified Skills UI

### Task 1: Add failing Skills page regression tests

**Files:**
- Create: `tests/pages/skills-page.test.ts`
- Modify: `src/pages/SkillsPage.tsx`

- [ ] **Step 1: Write the failing test**

Add coverage for:
- landing view renders a flat list of skills
- landing view does not render `Roles`, `Skills without roles`, or `No roles yet`
- page does not expose a create-role page action
- skill detail metadata does not render a `Roles:` summary

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/pages/skills-page.test.ts`
Expected: FAIL because the current page still renders role-management UI and role metadata.

- [ ] **Step 3: Implement the minimal UI change**

Update `src/pages/SkillsPage.tsx` to:
- remove page action registration
- remove role draft/create/edit state and handlers used only by role management
- render one skills list section in the landing view
- update the empty state to reflect missing skills
- remove the role summary line from the detail header

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/pages/skills-page.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C /workspace/companyhelm-web add tests/pages/skills-page.test.ts src/pages/SkillsPage.tsx
git -C /workspace/companyhelm-web commit -m "feat: simplify skills page browser"
```

## Chunk 2: Verify Wiring And Repo Coverage

### Task 2: Run repo-local verification and inspect common e2e coverage

**Files:**
- Inspect only: `src/App.tsx`
- Inspect only: `../companyhelm-common`

- [ ] **Step 1: Confirm parent wiring remains safe**

Inspect `src/App.tsx` usage of `SkillsPage` and confirm the simplified page still receives compatible props, or remove obviously dead props if doing so is low-risk within this change.

- [ ] **Step 2: Run frontend verification**

Run:
- `npm test -- tests/pages/skills-page.test.ts`
- `npm test`

Expected: PASS

- [ ] **Step 3: Inspect common e2e coverage**

Review `companyhelm-common` for any skills-page or roles-on-skills coverage that would need updates. If none exists, record that no common e2e change is required.

- [ ] **Step 4: Record verification results**

Capture which commands passed and whether `companyhelm-common` needed no changes.

- [ ] **Step 5: Commit**

```bash
git -C /workspace/companyhelm-web add src/pages/SkillsPage.tsx tests/pages/skills-page.test.ts
git -C /workspace/companyhelm-web commit -m "test: verify skills browser simplification"
```
