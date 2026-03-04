# Frontend JS-to-TS Migration Design

**Date:** 2026-03-04  
**Scope:** `frontend` repository only

## Objective

Convert every non-`scripts/**` JavaScript source file to TypeScript while preserving runtime behavior. This includes app code, config code, test files, and build config files.

## Constraints

- Files under `scripts/**` remain JavaScript.
- Test files are included in migration.
- Existing behavior must remain unchanged.
- Node-executed JavaScript under `scripts/**` currently imports `src/config/schema.js`; after conversion this must still work.

## Chosen Approach

1. Rename all tracked non-`scripts/**` `*.js` files to `*.ts`.
2. Rename `vite.config.js` to `vite.config.ts`.
3. Update internal imports to match new `.ts` targets.
4. Add TypeScript runtime tooling:
   - `typescript` for language/compiler support.
   - `tsx` so Node can execute JS scripts that import TS files.
5. Update package scripts:
   - `config:generate`: run via `tsx` for ESM + TS dependency resolution.
   - `test`: run via `tsx --test` on `.test.ts`.
6. Add a `tsconfig.json` configured for Vite + ESM + JSX, with permissive strictness for migration safety.

## Error Handling and Compatibility

- Keep script logic unchanged to avoid behavioral drift.
- Preserve public APIs and function signatures where possible.
- Avoid strict-type hardening in this migration; focus on file format conversion and execution compatibility.

## Verification

- Run frontend unit tests through updated `npm test`.
- Run frontend e2e checks using the shared script from `companyhelm-common`.

