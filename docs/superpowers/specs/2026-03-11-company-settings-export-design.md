# Company Settings Export Design

**Date:** 2026-03-11

## Goal

Add a company-scoped export flow that lets a user choose sections from Settings, request a sanitized YAML export from the API, and download the result in-browser.

## Current Context

- [`src/pages/SettingsPage.tsx`](/workspace/frontend/src/pages/SettingsPage.tsx) currently only supports company creation and deletion.
- Frontend data access is centralized through GraphQL documents in [`src/utils/graphql.ts`](/workspace/frontend/src/utils/graphql.ts).
- API GraphQL queries are implemented in [`src/graphql/schemas/query.ts`](/workspace/companyhelm-api/src/graphql/schemas/query.ts) and typed in [`src/graphql/schemas/schema.ts`](/workspace/companyhelm-api/src/graphql/schemas/schema.ts).
- The API already resolves company scope server-side, which is the correct boundary for export sanitization.

## Chosen Approach

Add a dedicated GraphQL query in `companyhelm-api` that accepts an explicit list of export sections and returns a generated filename plus YAML payload. Add a new export panel to `SettingsPage.tsx` that manages preset selection, manual section toggles, export request state, and browser download behavior.

Presets remain frontend-only helpers:

- `Sharable` selects `skills`, `skill_groups`, `roles`, `mcp_servers`, and `agents`
- `Full dump` selects every supported section

The API remains authoritative for sanitization and omission rules regardless of what the client requests.

## API Design

### Query Shape

Add a new company-scoped GraphQL query:

- `exportCompanyData(sections: [ExportSection!]!): CompanyExportPayload!`

Add supporting schema types:

- `ExportSection` enum for all exportable sections
- `CompanyExportPayload`
  - `filename: String!`
  - `yaml: String!`

The resolver should:

1. resolve company scope once
2. load only the requested sections
3. sanitize each section into export-safe records
4. serialize deterministic YAML
5. return the filename and YAML string

### Export Sections

Supported section enum values should cover the planned UI surface:

- `companyProfile`
- `agents`
- `skills`
- `skillGroups`
- `roles`
- `mcpServers`
- `repositories`
- `approvals`
- `agentRunners`
- `tasks`
- `threads`
- `threadData`

The API accepts any valid combination. Preset semantics are not encoded in the API.

### YAML Structure

The YAML output is section-based and includes export-only identifiers for each record so relationships stay unambiguous even when names collide.

Example shape:

```yaml
skills:
  - export_id: skill_1
    name: "Write release notes"
    description: "..."
roles:
  - export_id: role_1
    name: "Release manager"
    skill_export_ids:
      - skill_1
agents:
  - export_id: agent_1
    name: "Docs agent"
    role_export_ids:
      - role_1
```

Rules:

- `export_id` values are generated only for the export file
- they must not reuse database IDs or other internal identifiers
- relationships must reference `export_id`, not names
- names remain descriptive data only
- duplicate names must not cause export failure

### Sanitization Rules

The API owns all sanitization. The client may request sensitive sections, but the output must always omit secrets and internal-only identifiers.

For sharable sections:

- `skills`
  - include authored fields such as `name`, `description`, `content`, `instructions`, `file_list`, and related package metadata only if it is already user-facing and non-secret
  - omit database IDs, company IDs, timestamps, and internal foreign keys
- `skill_groups`
  - include `name` and referenced skill export IDs
  - omit internal IDs and timestamps
- `roles`
  - include `name`, parent relationship, direct skill relationships, skill group relationships, MCP server relationships, and other authored configuration needed to recreate the role
  - omit internal IDs, company IDs, timestamps, and computed-only fields that can be re-derived
- `mcp_servers`
  - include safe configuration such as `name`, transport type, command, args, url, enabled flag, and non-sensitive metadata
  - omit bearer tokens, linked secret IDs, secret-backed env/header values, OAuth credentials, last-error/auth status internals, and other secret-derived data
- `agents`
  - include `name`, selected SDK/model settings, custom/default additional instructions, and linked role/MCP server export IDs
  - omit runner assignment, operational status, company IDs, timestamps, and internal IDs

For non-sharable sections:

- thread, transcript, queued-message, approval, repository, runner, and task sections should follow the same rule set: export only user-meaningful fields needed for a faithful dump while omitting secrets, secret references, request/queue internals, and database identifiers

### Filename Behavior

The API returns a deterministic filename in the form:

- `<company-slug>-export-YYYY-MM-DD.yaml`

If the requested section set exactly matches the sharable preset, the filename may include a suffix:

- `<company-slug>-export-sharable-YYYY-MM-DD.yaml`

Otherwise use the generic export filename.

## Frontend Design

### Settings Panel

Add an export panel above the existing danger zone in [`src/pages/SettingsPage.tsx`](/workspace/frontend/src/pages/SettingsPage.tsx).

The panel should include:

- a short explanation of what export does
- two preset actions: `Sharable` and `Full dump`
- a checkbox list for all exportable sections
- inline validation and request error text
- an `Export YAML` button

### Interaction Flow

1. user opens Settings
2. user clicks a preset or manually toggles sections
3. frontend validates that at least one section is selected
4. frontend sends one GraphQL request with the selected sections
5. frontend receives `filename` and `yaml`
6. frontend creates a `Blob` and triggers a browser download

The panel should disable the export button while the export request is in flight.

### Preset Semantics

Presets only seed checkbox state. After applying a preset, the user can still change any section manually.

- `Sharable`: `skills`, `skillGroups`, `roles`, `mcpServers`, `agents`
- `Full dump`: every exportable section

### Error Handling

Frontend error handling is limited to request-state concerns:

- no sections selected
- network/server failure
- unexpected empty payload

Name collisions are not an error condition because the file uses export-only IDs.

## Testing

### API

Add tests for:

- schema exposure of the new query and enum
- company-scope enforcement
- section filtering so unrequested sections are absent
- sharable export sanitization
- a thread-inclusive export shape
- duplicate-name success behavior using export-only IDs
- deterministic YAML structure and filename generation

### Frontend

Add tests for:

- preset selection behavior
- manual checkbox overrides after preset application
- export button disabled state during request
- request payload sent to GraphQL
- successful download flow using returned filename and YAML
- inline validation and request error rendering

### Verification

Because this feature changes API and frontend only:

- run targeted and relevant repo-local tests in `companyhelm-api`
- run targeted and relevant repo-local tests in `frontend`
- inspect [`tests/system/05-configuration/configuration.spec.ts`](/workspace/companyhelm-common/tests/system/05-configuration/configuration.spec.ts) and related `companyhelm-common` system coverage to confirm no export-specific e2e updates are required

## Out Of Scope

- Importing the exported YAML
- Export history or audit logs
- Background export jobs
- Secret export or secret rehydration
- Changing existing Settings company creation/deletion flows beyond adding the new panel
