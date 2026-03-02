# CompanyHelm

React SPA for `companyhelm-api` GraphQL.

## Run locally

```bash
nvm use 22
npm install
npm run dev -- --environment local
```

Open `http://localhost:5173`.

Frontend config is loaded from `config/<environment>.yaml` and validated with `zod`.
Environment selection requires `--environment <name>` (or `--environment=<name>`).

Current config fields:
- `server.host`
- `server.listeningPort`
- `api.graphqlApiUrl`
- `authProvider` (`companyhelm`)
- `auth.companyhelm.tokenStorageKey`

`api.graphqlApiUrl` is used to derive:
- Vite `/graphql` proxy target
- Relay HTTP GraphQL URL
- Relay WebSocket GraphQL URL

## Build

```bash
npm run build -- --environment local
npm run preview -- --environment local
```

Example for a non-local environment:
```bash
npm run build -- --environment prod
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
