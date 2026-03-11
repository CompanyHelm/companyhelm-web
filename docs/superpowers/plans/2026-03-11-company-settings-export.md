# Company Settings Export Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Settings export flow that lets users choose company sections, request a sanitized YAML export from `companyhelm-api`, and download it in the browser.

**Architecture:** Add a dedicated company-scoped GraphQL query in `companyhelm-api` that assembles export-safe YAML from requested sections. Wire `frontend` Settings UI to that single query with preset-based checkbox state, inline validation, and browser download behavior. Keep sanitization and export-only ID generation entirely in the API.

**Tech Stack:** TypeScript, GraphQL, Drizzle ORM, YAML, React, node:test, Vitest

---

## Chunk 1: API Schema And Export Tests

### Task 1: Add failing GraphQL schema coverage for the export query

**Files:**
- Create: `companyhelm-api/tests/graphql.export-schema.test.ts`
- Modify: `companyhelm-api/src/graphql/schemas/schema.ts`
- Modify: `companyhelm-api/src/graphql/schemas/__generated__/resolvers-types.ts`

- [ ] **Step 1: Write the failing schema test**

Add a schema test that asserts:
- `Query.exportCompanyData` exists
- `ExportSection` exists with the planned enum values
- `CompanyExportPayload` exists with `filename` and `yaml`
- `exportCompanyData` does not expose a `companyId` arg

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/graphql.export-schema.test.ts`
Expected: FAIL because the schema types and query field do not exist yet.

- [ ] **Step 3: Add schema placeholders and generated types**

Implement the minimum schema surface:
- add `ExportSection` enum in `companyhelm-api/src/graphql/schemas/schema.ts`
- add `CompanyExportPayload` object type in `companyhelm-api/src/graphql/schemas/schema.ts`
- add `exportCompanyData` to `QueryType` with `sections: [ExportSection!]!`
- regenerate resolver types with `npm run codegen`

- [ ] **Step 4: Run the schema test again**

Run: `npm test -- tests/graphql.export-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C /workspace/companyhelm-api add tests/graphql.export-schema.test.ts src/graphql/schemas/schema.ts src/graphql/schemas/__generated__/resolvers-types.ts
git -C /workspace/companyhelm-api commit -m "test: add export query schema coverage"
```

### Task 2: Add failing API resolver tests for sharable export behavior

**Files:**
- Create: `companyhelm-api/tests/graphql.company-export.resolver.test.ts`
- Modify: `companyhelm-api/src/graphql/schemas/query.ts`
- Create: `companyhelm-api/src/export/company-export.ts`

- [ ] **Step 1: Write the failing resolver tests**

Add focused tests that call `resolvers.Query.exportCompanyData` and cover:
- sharable export returns YAML and filename
- only requested sections appear
- export-only IDs are generated and used for relationships
- duplicate names succeed rather than error
- secrets and secret-derived MCP fields are omitted

- [ ] **Step 2: Run the resolver test to verify it fails**

Run: `npm test -- tests/graphql.company-export.resolver.test.ts`
Expected: FAIL because the resolver and export builder do not exist yet.

- [ ] **Step 3: Implement the export builder**

Create `companyhelm-api/src/export/company-export.ts` with:
- `EXPORT_SECTION_VALUES`
- deterministic section ordering
- export-only ID generation helpers per section
- section loaders for `skills`, `skillGroups`, `roles`, `mcpServers`, and `agents`
- YAML serialization using the existing `yaml` dependency
- filename generation based on company name and date
- sanitization helpers that omit IDs, company IDs, timestamps, runner assignments, statuses, secret IDs, token-backed env/header values, and OAuth internals

- [ ] **Step 4: Wire the resolver**

Update `companyhelm-api/src/graphql/schemas/query.ts` to:
- add `exportCompanyData` to `rawQueryResolvers`
- resolve company scope once
- fetch the company name for filename generation
- call the export builder with requested sections
- add `exportCompanyData` to `COMPANY_SCOPED_QUERY_RESOLVER_KEYS`

- [ ] **Step 5: Run targeted API tests**

Run:
- `npm test -- tests/graphql.company-export.resolver.test.ts`
- `npm test -- tests/graphql.export-schema.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git -C /workspace/companyhelm-api add tests/graphql.company-export.resolver.test.ts src/export/company-export.ts src/graphql/schemas/query.ts
git -C /workspace/companyhelm-api commit -m "feat: add company export query"
```

## Chunk 2: Frontend Settings Export UI

### Task 3: Add failing Settings page component coverage

**Files:**
- Create: `frontend/tests/components/settings-page.test.ts`
- Modify: `frontend/src/pages/SettingsPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/utils/graphql.ts`

- [ ] **Step 1: Write the failing Settings page tests**

Add tests for:
- sharable preset seeds `skills`, `skillGroups`, `roles`, `mcpServers`, and `agents`
- full dump preset selects all sections
- manual checkbox changes persist after preset selection
- export button disables while export is pending
- validation error shows when no sections are selected

- [ ] **Step 2: Run the component test to verify it fails**

Run: `npm test -- tests/components/settings-page.test.ts`
Expected: FAIL because the export panel and props do not exist yet.

- [ ] **Step 3: Add the GraphQL document**

Update `frontend/src/utils/graphql.ts` with a new company API query string:
- `COMPANY_API_EXPORT_COMPANY_DATA_QUERY`

Return:
- `exportCompanyData { filename yaml }`

- [ ] **Step 4: Implement Settings page UI**

Update `frontend/src/pages/SettingsPage.tsx` to add:
- export section metadata and preset definitions
- checkbox state and preset handlers
- inline validation and request error rendering
- `Export YAML` button
- props for selected sections, export state, and event handlers

Use existing panel/form class patterns first and add CSS only if the current styles are insufficient.

- [ ] **Step 5: Wire App state and request execution**

Update `frontend/src/App.tsx` to:
- hold selected export sections, export error, and pending state
- call `executeRawGraphQL(COMPANY_API_EXPORT_COMPANY_DATA_QUERY, { sections })`
- validate response payload
- create a `Blob`, object URL, and temporary anchor to trigger the download
- clean up the object URL after download
- pass the new props into `SettingsPage`

- [ ] **Step 6: Run the frontend component test**

Run: `npm test -- tests/components/settings-page.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git -C /workspace/frontend add tests/components/settings-page.test.ts src/pages/SettingsPage.tsx src/App.tsx src/utils/graphql.ts
git -C /workspace/frontend commit -m "feat: add settings export panel"
```

## Chunk 3: End-To-End Verification For Changed Repos

### Task 4: Add download-flow coverage and run repo-local verification

**Files:**
- Modify: `frontend/tests/components/settings-page.test.ts`
- Modify: `companyhelm-api/tests/graphql.company-export.resolver.test.ts`
- Inspect only: `companyhelm-common/tests/system/05-configuration/configuration.spec.ts`

- [ ] **Step 1: Extend frontend test for download behavior**

Assert that the App-level handler:
- sends the selected section values to GraphQL
- receives `filename` and `yaml`
- invokes browser download behavior with those values

If mocking the DOM download primitives is awkward at the page level, keep the UI state assertions in `settings-page.test.ts` and add an App-level test in a new file instead of weakening the coverage.

- [ ] **Step 2: Extend API test for full-dump-adjacent behavior**

Add at least one resolver test that includes non-sharable thread data so the export builder proves it can serialize a broader selection without leaking internal IDs.

- [ ] **Step 3: Run targeted repo-local verification**

Run in `companyhelm-api`:
- `npm test -- tests/graphql.export-schema.test.ts tests/graphql.company-export.resolver.test.ts`
- `npm run typecheck`

Run in `frontend`:
- `npm test -- tests/components/settings-page.test.ts`

If the App wiring requires broader regression coverage, also run:
- `npm test`

- [ ] **Step 4: Inspect system test coverage**

Review `companyhelm-common/tests/system/05-configuration/configuration.spec.ts` and nearby system tests to confirm there is no existing Settings export flow that needs updating.

- [ ] **Step 5: Record verification results**

Capture which commands passed, any skipped coverage, and whether `companyhelm-common` needed no test changes.

- [ ] **Step 6: Commit**

```bash
git -C /workspace/companyhelm-api add tests/graphql.company-export.resolver.test.ts
git -C /workspace/companyhelm-api commit -m "test: cover export sanitization"
git -C /workspace/frontend add tests/components/settings-page.test.ts
git -C /workspace/frontend commit -m "test: cover settings export download flow"
```
