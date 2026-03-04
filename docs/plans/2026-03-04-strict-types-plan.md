# Frontend Strict Types Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make frontend app + tests pass TypeScript strict mode with all remaining JSX converted to TSX.

**Architecture:** Perform extension migration first (`.jsx` -> `.tsx`), then close strict type gaps by adding explicit interfaces, field declarations, and selective `any` boundaries around dynamic data paths.

**Tech Stack:** React, TypeScript (strict), Vite, Node test runner (tsx).

---

### Task 1: TSX Conversion

**Files:**
- Modify: `src/**/*.jsx`
- Create: `src/**/*.tsx` via rename

1. Rename all `src/**/*.jsx` files to `.tsx`.
2. Update explicit `.jsx` import specifiers to `.tsx`.
3. Run `npx tsc --noEmit --strict` and collect remaining errors.

### Task 2: Strict Typing Refactor

**Files:**
- Modify: `src/**/*.ts`, `src/**/*.tsx`, `tests/**/*.ts`, typings files

1. Add missing field/property declarations in classes.
2. Add explicit parameter/return annotations where inference fails.
3. Introduce lightweight shared types for dynamic GraphQL/chat payloads.
4. Add module/type declaration shims for untyped deps as needed.
5. Make test mocks compatible with strict type signatures.

### Task 3: Verification

1. `npm test`
2. `npm run build`
3. `FRONTEND_PORT=4173 bash /workspace/companyhelm-common/scripts/e2e-debug-up.sh --smoke`
4. `npx tsc --noEmit --strict`

### Task 4: Branch + PR

1. Rebase onto latest `origin/main` (and preserve stacked dependency context).
2. Push strict branch.
3. Open dedicated PR and wait for checks.

