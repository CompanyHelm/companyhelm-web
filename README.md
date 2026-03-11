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
- generator: `scripts/config/generate-runtime-config.js`
- validation schema: `src/config/schema.ts` (Zod)
- generated file: `src/generated/config.js` (gitignored)

The script takes `--config-path <path>` and hard-fails when:
- `--config-path` is omitted
- `--config-path` is missing a value
- the referenced YAML file is missing
- YAML does not satisfy `runtimeConfigSchema`

`npm run dev`, `npm run build`, and `npm run preview` run this generator first:
- those package scripts pass `config/local.yaml` explicitly for local verification

You can run the generator directly:

```bash
npm run config:generate -- --config-path config/local.yaml
```

Or point it at an explicit YAML file:

```bash
npm run config:generate -- --config-path /path/to/config.yaml
```

The app bootstraps by importing `src/generated/config.js` at startup.

In containers, the frontend image rebuilds the static bundle on startup from an
explicit runtime config file. Set `COMPANYHELM_CONFIG_PATH` to the YAML path and
optionally `COMPANYHELM_CONFIG_S3_URI` to download that file before the build
runs.

There is no runtime fallback order. Startup now requires an explicit config path.
Deployment-owned dev/prod frontend YAML lives in `companyhelm-infra`, not this repo.

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

- `main` pushes build and publish `main-<shortsha>` and `latest` images to ECR.
- `v*` tag pushes build and publish the matching release image tag without the leading `v`, for example `v0.0.1` -> `0.0.1`.
- Deployments and runtime config publication are owned outside this repo.
- Dev frontend traffic is expected at `https://app.dev.companyhelm.com`.

## Relay client

Frontend GraphQL traffic is routed through a Relay runtime environment (`src/relay/`):
- query response cache with short TTL for fast repeat reads
- in-flight query dedupe to avoid duplicate network requests
- cache invalidation on mutations
- GraphQL-over-WebSocket subscriptions through Relay network

## GraphQL schema artifacts

GraphQL schema snapshots are committed in `schema/schema.graphql` and `schema/schema.json`.
These files are synced from `companyhelm-api` whenever the API schema changes.
