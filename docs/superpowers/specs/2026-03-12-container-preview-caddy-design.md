# Frontend Container Preview Caddy Design

**Date:** 2026-03-12

## Goal

Replace the container-only static serving step in `preview:container` with Caddy while keeping the existing runtime-config generation and Vite build flow unchanged.

## Current Context

- `scripts/docker-entrypoint.sh` requires `COMPANYHELM_CONFIG_PATH` and launches `npm run preview:container`.
- `scripts/start-preview-container.js` rebuilds the app at container startup, then starts a custom Node static server.
- `npm run preview` is still the local developer preview flow and should remain Vite-based.
- `Dockerfile` currently builds a Node runtime image with `aws-cli` installed for config download support.

## Chosen Approach

Keep Node in the runtime image for startup config generation and the Vite build, but replace the final HTTP serving process with Caddy configured by a checked-in `Caddyfile`.

### Runtime Flow

1. `docker-entrypoint.sh` validates or downloads the runtime config YAML.
2. `scripts/start-preview-container.js` runs the existing Vite build against `COMPANYHELM_CONFIG_PATH`.
3. The same script then launches Caddy using the checked-in `Caddyfile`.

### Caddy Behavior

- Serve files from `/app/dist`.
- Return `404` for missing static asset requests.
- Fall back to `/index.html` for SPA routes.
- Bind to `{$PORT}` with a default of `4173`.

### Local Development Boundary

- `npm run preview` remains unchanged and continues to use Vite.
- Only `npm run preview:container` switches from the custom Node server to Caddy.

## Testing

- Replace custom static-server tests with preview-container command wiring tests for Caddy.
- Keep the existing container config-path and port validation tests.
- Run frontend unit tests and a container runtime smoke check to confirm the image serves the built app through Caddy.
