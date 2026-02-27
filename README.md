# CompanyHelm

React SPA for `companyhelm-api` GraphQL.

## Run locally

```bash
nvm use 22
npm install
npm run dev
```

Open `http://localhost:5173`.

By default, `/graphql` is proxied to `http://127.0.0.1:4000` (the `companyhelm-api` local default).
Override with `VITE_GRAPHQL_PROXY_TARGET` when needed.

## Build

```bash
npm run build
npm run preview
```

## GraphQL schema artifacts

GraphQL schema snapshots are committed in `schema/schema.graphql` and `schema/schema.json`.
These files are synced from `companyhelm-api` whenever the API schema changes.
