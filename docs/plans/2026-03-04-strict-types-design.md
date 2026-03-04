# Frontend Strict Typing Design

**Date:** 2026-03-04  
**Scope:** frontend strict typing follow-up on top of JS->TS migration

## Objective

Enable TypeScript strict mode for frontend app and tests, and refactor remaining files so strict typecheck passes.

## Constraints

- Convert all remaining `src/**/*.jsx` files to `*.tsx`.
- Include tests in strict typecheck.
- Targeted `any` is acceptable for now where upstream or dynamic payload typing is costly.
- Keep runtime behavior unchanged.

## Approach

1. Convert all JSX files to TSX and update import specifiers where extensions are explicit.
2. Enable strict mode in `tsconfig.json`.
3. Iterate on `tsc --noEmit` errors:
   - Add missing class fields and parameter types.
   - Add light shared helper types for payload-heavy utility modules.
   - Add declaration shims for untyped external modules.
   - Make tests strict-compatible with typed mocks.
4. Re-run test/build/e2e smoke verification.

