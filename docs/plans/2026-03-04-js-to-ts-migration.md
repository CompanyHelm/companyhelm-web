# Frontend JS-to-TS Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert all non-`scripts/**` JavaScript files in `frontend` to TypeScript with no behavior changes.

**Architecture:** Perform a bulk file rename (`.js` -> `.ts`) for non-script files, then update import specifiers and runtime scripts to preserve module resolution across Vite, Node tests, and script execution paths. Keep migration permissive and non-invasive for logic.

**Tech Stack:** React, Vite, Node test runner, TypeScript, tsx, ESM modules.

---

### Task 1: Baseline and Inventory

**Files:**
- Modify: `package.json`
- Test: `tests/**/*.test.ts` (post-rename target)

**Step 1: Record current non-script JavaScript inventory**

Run: `git ls-files '*.js' | rg -v '^scripts/'`
Expected: only files in `src/`, `tests/`, and `vite.config.js`.

**Step 2: Install TS runtime tooling**

Run: `npm install -D typescript tsx`
Expected: lockfile updates and no install errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add typescript and tsx tooling for migration"
```

### Task 2: Rename and Rewrite Imports

**Files:**
- Modify: all non-`scripts/**` tracked `*.js` files
- Create: corresponding `*.ts` files via rename
- Create: `tsconfig.json`
- Modify: `package.json`

**Step 1: Rename files**

Run: `git ls-files '*.js' | rg -v '^scripts/'` and rename each file to `.ts`.
Expected: no `*.js` remain outside `scripts/**`.

**Step 2: Update import specifiers**

Rewrite internal imports from `.js` to `.ts` for renamed targets.

**Step 3: Update npm scripts**

- `config:generate` -> `tsx scripts/config/generate-runtime-config.js`
- `test` -> `tsx --test tests/**/*.test.ts`

**Step 4: Add TypeScript config**

Add `tsconfig.json` with:
- `module`/`moduleResolution` = `NodeNext`
- `target` = `ES2022`
- `jsx` = `react-jsx`
- `allowJs` false
- `noEmit` true
- permissive migration flags (`strict: false`, `skipLibCheck: true`)

**Step 5: Commit**

```bash
git add .
git commit -m "refactor: migrate frontend non-script js files to typescript"
```

### Task 3: Verification

**Files:**
- Test: `tests/**/*.test.ts`

**Step 1: Run unit tests**

Run: `npm test`
Expected: passing test suite.

**Step 2: Run frontend e2e script from common repo**

Run shared e2e script with frontend target.
Expected: all frontend e2e checks pass.

**Step 3: Commit if needed**

If fixes are required, commit them with focused message.

### Task 4: Branch Hygiene and PR

**Files:**
- None

**Step 1: Rebase on latest main**

Run:
```bash
git fetch origin
git rebase origin/main
```
Expected: clean rebase with no conflicts.

**Step 2: Push branch and open PR**

Run:
```bash
git push -u origin <branch>
gh pr create --fill
```
Expected: PR URL created.

**Step 3: Wait for checks and resolve failures**

Use:
```bash
gh pr checks --watch
```
Expected: all checks pass or are fixed and re-pushed.

