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
`src/generated/config.js` before Vite starts.

- source files:
  - `config/local.yaml`
  - `config/dev.yaml`
  - `config/prod.yaml`
- generator: `scripts/config/generate-runtime-config.js`
- validation schema: `src/config/schema.ts` (Zod)
- generated file: `src/generated/config.js` (gitignored)

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

The app bootstraps by importing `src/generated/config.js` at startup.

In containers, the frontend image remains environment-agnostic. The container
entrypoint rebuilds the static bundle on startup using
`COMPANYHELM_ENVIRONMENT=<dev|prod>`, which still flows through
`config/<environment>.yaml` and `src/generated/config.js`.

Current config fields:
- `api.graphqlApiUrl`
- `api.runnerGrpcTarget`
- `auth.provider` (`companyhelm` or `supabase`)
- `auth.companyhelm.tokenStorageKey`
- `auth.supabase.url` (required when `auth.provider: supabase`)
- `auth.supabase.anonKey` (required when `auth.provider: supabase`)
- `auth.supabase.tokenStorageKey` (required when `auth.provider: supabase`)

`api.graphqlApiUrl` is used to derive:
- Relay HTTP GraphQL URL
- Relay WebSocket GraphQL URL

## Build

```bash
npm run build
npm run preview
```

## Deployment

- `main` pushes build an immutable `main-<shortsha>` image and deploy it to the
  dev ECS service.
- `v*` tags promote the already-built `main-<shortsha>` image to prod.
- Dev frontend traffic is expected at `https://dev.app.companyhelm.com`.

## Relay client

Frontend GraphQL traffic is routed through a Relay runtime environment (`src/relay/`):
- query response cache with short TTL for fast repeat reads
- in-flight query dedupe to avoid duplicate network requests
- cache invalidation on mutations
- GraphQL-over-WebSocket subscriptions through Relay network

## GraphQL schema artifacts

GraphQL schema snapshots are committed in `schema/schema.graphql` and `schema/schema.json`.
These files are synced from `companyhelm-api` whenever the API schema changes.
