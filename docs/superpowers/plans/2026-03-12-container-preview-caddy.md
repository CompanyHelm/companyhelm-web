# Frontend Container Preview Caddy Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the container preview HTTP server with Caddy while preserving the current runtime-config generation and build flow.

**Architecture:** Keep the Node-based startup path that validates runtime config and runs the Vite build at container boot. After the build completes, start Caddy with a checked-in `Caddyfile` that serves `/app/dist`, preserves SPA fallback, and returns `404` for missing assets.

**Tech Stack:** Node.js, node:test, shell scripts, Docker, Caddy

---

## Chunk 1: Preview Script TDD

### Task 1: Update preview-container tests to describe Caddy launch behavior

**Files:**
- Modify: `tests/config/start-preview-container.test.ts`

- [ ] **Step 1: Write failing tests**

Add expectations that `buildPreviewServeCommandArgs` now targets `caddy run` with the checked-in `Caddyfile`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/config/start-preview-container.test.ts`
Expected: FAIL because the script still targets `scripts/serve-static-container.js`.

### Task 2: Implement the Caddy handoff

**Files:**
- Modify: `scripts/start-preview-container.js`
- Create: `Caddyfile`
- Delete: `scripts/serve-static-container.js`
- Delete: `tests/config/serve-static-container.test.ts`

- [ ] **Step 1: Implement the minimal runtime change**

Update the preview-container script to launch Caddy after the build and replace the custom static server with a checked-in `Caddyfile`.

- [ ] **Step 2: Run focused verification**

Run: `npm test -- tests/config/start-preview-container.test.ts`
Expected: PASS

## Chunk 2: Container Integration

### Task 3: Update the runtime image to include Caddy

**Files:**
- Modify: `Dockerfile`

- [ ] **Step 1: Install Caddy in the runtime image**

Keep `aws-cli` and add Caddy to the same Alpine runtime image.

- [ ] **Step 2: Run full frontend verification**

Run: `npm test`
Expected: PASS

### Task 4: Run container/runtime smoke checks and update the PR branch

**Files:**
- No code changes required unless verification finds a defect

- [ ] **Step 1: Build and smoke-test the container**

Run the frontend image locally, confirm `/`, `/assets/...`, and an SPA route load correctly through Caddy.

- [ ] **Step 2: Rebase on `origin/main`, push the PR branch, and check PR status**

Use non-interactive Git commands only. Update PR `#165` in place.
