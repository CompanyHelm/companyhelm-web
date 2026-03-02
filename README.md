# CompanyHelm

React SPA for `companyhelm-api` GraphQL.

## Run locally

```bash
nvm use 22
npm install
npm run dev -- --environment local
```

Open `http://localhost:5173`.

The frontend now requires `--environment <name>` (or `--environment=<name>`) on startup.
Config files live in `config/<environment>.yaml` and are validated with `zod`.

Current config fields:
- `server.listeningPort`
- `api.graphqlApiUrl`

`api.graphqlApiUrl` is used to derive:
- Vite `/graphql` proxy target
- Relay HTTP GraphQL URL
- Relay WebSocket GraphQL URL

## Build

```bash
npm run build -- --environment local
npm run preview -- --environment local
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
