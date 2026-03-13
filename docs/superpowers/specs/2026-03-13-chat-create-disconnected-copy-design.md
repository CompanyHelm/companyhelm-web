# Chat Create Disconnected Copy Design

**Date:** 2026-03-13

## Goal

Replace the chat page disabled-state message for unavailable assigned runners with the shorter copy `Disconnected`.

## Current Context

- `src/App.tsx` computes the chat creation blocked reason for assigned runners.
- The current blocked message includes the runner id and a Codex SDK explanation.
- The change request is scoped only to the chat page. Agent creation copy and backend validation stay unchanged.

## Chosen Approach

Keep the existing chat creation gating logic and only change the returned copy string in the chat page helper that supplies the disabled reason.

This keeps behavior stable, avoids changing backend validation semantics, and limits the surface area to the UI path the user requested.

## Interaction Flow

1. User opens the chat page.
2. Frontend evaluates whether the assigned runner is ready and connected.
3. If the runner is unavailable, the New chat control remains disabled.
4. The warning text and button tooltip display `Disconnected`.

## State And Error Handling

- No state changes are required.
- No API changes are required.
- The existing readiness and connectivity checks remain the source of truth for whether chat creation is blocked.

## Component Boundaries

- `src/App.tsx`
  - keeps ownership of the helper that produces the chat-page disabled reason
  - changes only the blocked copy returned for disconnected runners
- `tests/chat/agent-chat-sidebar-actions.test.ts`
  - gains focused coverage that the warning text renders `Disconnected`

## Testing

Add or update frontend tests to cover:

- the chat page warning text shows `Disconnected` when chat creation is blocked for a disconnected assigned runner
- the old long-form message no longer appears in that chat page path

Verification is frontend-only. No shared e2e changes are expected unless `companyhelm-common` contains coverage tied to the old copy.

## Out Of Scope

- Changing agent creation validation copy
- Changing chat creation eligibility rules
- Adding backend validation for this UI copy path
