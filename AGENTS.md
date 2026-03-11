# Frontend Data Fetching Rules

## Goals

- Minimize API calls per page load.
- Prefer one page-level GraphQL query after company selection whenever possible.
- Do not keep legacy/retrocompat data-fetch behavior if it causes extra network calls.

## Required Rules

- On **Agents page refresh**:
  1. Fetch companies.
  2. Fetch agents page payload.
  No additional API calls are allowed during initial render.

- Agents page payload must include all data required to render agent cards/editor defaults:
  - agent status
  - runner status
  - SDKs
  - models
  - reasoning levels

- For every other page:
  - avoid incremental N+1 loading patterns
  - avoid background fetches for inactive pages/routes
  - only fetch data needed by the active page/route

## Implementation Preferences

- Use nested GraphQL selections to return complete page payloads.
- Reuse already-loaded state instead of re-fetching identical data.
- Load per-item details lazily only when the user opens a detail/edit flow.

## Configuration Source of Truth

- Runtime/frontend configuration values must come from an explicit YAML file path,
  generated to `src/generated/config.js` by `scripts/config/generate-runtime-config.js`.
- Do not read runtime config values from `import.meta.env`, `VITE_*`, or other
  environment variables.
- Resolve config in this order:
  - `--config-path <path>`
  - `COMPANYHELM_CONFIG_PATH`
  - `config/local.yaml`
- Deployment-owned frontend YAML does not live in this repo. `dev`/`prod` deployment
  config belongs in `companyhelm-infra`.
- If new frontend config values are introduced, add them to:
  - `src/config/schema.ts`
  - `config/local.yaml`
  - `scripts/config/generate-runtime-config.js` (if transformation logic changes)
