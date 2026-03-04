# CompanyHelm

React SPA for `companyhelm-api` GraphQL.

## Run locally

```bash
nvm use 22
npm install
npm run dev
```

Open `http://localhost:4173`.

## Runtime config generation

Runtime config is generated from YAML files under `config/` and written to
`public/config.json` before Vite starts.

- source files:
  - `config/local.yaml`
  - `config/dev.yaml`
  - `config/prod.yaml`
- generator: `scripts/config/generate-runtime-config.js`
- validation schema: `src/config/schema.js` (Zod)
- generated file: `public/config.json` (gitignored)

The script takes `--environment <local|dev|prod>` and hard-fails when:
- `--environment` is missing/invalid
- `config/<environment>.yaml` is missing
- YAML does not satisfy `runtimeConfigSchema`

`npm run dev`, `npm run build`, and `npm run preview` run this generator first:
- `dev` uses `local`
- `build` and `preview` use `prod`

You can run the generator directly:

```bash
npm run config:generate -- --environment local
```

The app bootstraps by fetching `/config.json` at startup. If the file cannot be
loaded, startup fails immediately with an error screen.

Current config fields:
- `api.graphqlApiUrl`
- `api.runnerGrpcTarget`
- `authProvider` (`companyhelm` or `supabase`)
- `auth.companyhelm.tokenStorageKey`
- `auth.supabase.url` (required when `authProvider: supabase`)
- `auth.supabase.anonKey` (required when `authProvider: supabase`)
- `auth.supabase.tokenStorageKey` (required when `authProvider: supabase`)

`api.graphqlApiUrl` is used to derive:
- Relay HTTP GraphQL URL
- Relay WebSocket GraphQL URL

## Build

```bash
npm run build
npm run preview
```

## Relay client

Frontend GraphQL traffic is routed through a Relay runtime environment (`src/relay/`):
- query response cache with short TTL for fast repeat reads
- in-flight query dedupe to avoid duplicate network requests
- cache invalidation on mutations
- GraphQL-over-WebSocket subscriptions through Relay network

## GraphQL schema artifacts

GraphQL schema snapshots are committed in `schema/schema.graphql` and `schema/schema.json`.
These files are synced from `companyhelm-api` whenever the API schema changes.
