# CompanyHelm

React SPA for `companyhelm-api` GraphQL.

## Run locally

```bash
nvm use 22
npm install
npm run dev
```

Open `http://localhost:4173`.

Frontend config is loaded from `src/config/` and validated with `zod`.
`src/config/config.js` resolves config in this order:
1. `window.__COMPANYHELM_CONFIG__` runtime override (when present)
2. `src/config/production.js` for non-local hostnames
3. `src/config/development.js` fallback

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
