# Strict Chats Route Resolution

## Goal

Make the `/chats` URL authoritative.

- Bare `/chats` may still choose a default agent/thread.
- Any explicit `agentId` and/or `threadId` in the URL must target that exact resource.
- Invalid explicit routes must render a clear not-found state instead of silently falling back to the first available chat.

## Problem

The current `/chats` route resolver mixes two behaviors:

1. Default navigation for a bare `/chats` route.
2. Recovery behavior for partially loaded or invalid explicit routes.

Because those behaviors are coupled, the UI can replace a newly created or explicitly requested thread with the first already-loaded thread for the agent. That makes the route non-authoritative and hides invalid navigation behind a fallback selection.

## Recommended Approach

Keep the current default behavior only for bare `/chats`, and make every explicit route strict.

This removes the stale-state race where loaded list data can override the URL, and it makes invalid routes observable so they can be debugged instead of being masked by redirect logic.

## Route Semantics

### Bare Route

`/chats`

- Preserve current default behavior.
- If agents and chats exist, the app may choose the first available agent/thread based on existing desktop/mobile rules.
- If nothing is available, keep the empty chats state.

### Agent Route

`/chats?agentId=<agent>`

- Render that agent's chats list.
- Do not replace an invalid `agentId` with another agent.
- If the agent cannot be resolved for the selected company, render a chats not-found state with copy indicating that the agent does not exist.

### Thread Route

`/chats?threadId=<thread>`

- Resolve the owning agent from the thread when possible.
- If the thread exists, navigate the page state to that exact thread.
- If the thread cannot be resolved, render the chats not-found state with copy indicating that the thread does not exist.

### Agent + Thread Route

`/chats?agentId=<agent>&threadId=<thread>`

- Treat this as an exact route contract.
- If the thread exists and belongs to that agent, render that exact chat.
- If the thread does not exist, render not found.
- If the agent does not exist, render not found.
- If both exist but the thread belongs to a different agent, render not found instead of silently correcting the route.

## Architecture

Keep the strictness decision in the chat-route navigation layer so the page shell and chat components do not each invent their own fallback rules.

Implementation should center on `src/utils/chat-route-navigation.ts` plus the `App.tsx` effects that currently normalize `/chats` into a default route. The route resolver should return an explicit outcome:

- default route resolution for bare `/chats`
- exact route resolution for explicit params
- not-found route state for invalid explicit params

The rendered page should consume that outcome and decide whether to show:

- the normal chat list/detail UI
- the empty default chats state
- a dedicated not-found state

## Components and State

Add a focused chats-route state object in `App.tsx` for strict-route failures instead of encoding not-found through redirects.

Suggested state shape:

- `kind: "ok" | "not_found"`
- `message: string`
- `requestedAgentId: string`
- `requestedThreadId: string`

This state should be derived from route resolution and cleared whenever the URL changes to a resolvable route.

The existing `selectedChatSession` placeholder behavior should remain. If the URL references a thread that is still loading or has just been created, the app should keep the requested route active while the thread lookup is in flight.

## Data Flow

1. Parse the current `/chats` route from the URL.
2. If the route is bare, use existing default selection rules.
3. If the route contains explicit params, resolve them strictly:
   - validate `agentId` against loaded agents when present
   - validate `threadId` against loaded sessions when possible
   - if needed, call the existing thread lookup path to resolve an unloaded thread
4. While explicit thread resolution is pending, keep the requested route active and avoid fallback redirects.
5. If the explicit target resolves, hydrate page state with that exact agent/thread.
6. If the explicit target definitively fails validation, set the chats not-found state and render it without redirecting to another chat.

## Error Handling

Not-found should be treated differently from transport failures.

- Invalid explicit route: render a user-facing not-found state in the chats area.
- Temporary load failure for a thread lookup: keep existing error handling, but do not auto-fallback to another chat.
- Mismatched `agentId` + `threadId`: render not-found copy that explains the route is invalid for the selected agent.

## Testing

Add focused coverage in two places:

1. `tests/utils/chat-route-navigation.test.ts`
   - bare `/chats` still defaults
   - explicit invalid `agentId` returns not-found instead of first agent
   - explicit invalid `threadId` returns not-found instead of first thread
   - mismatched `agentId` + `threadId` returns not-found
   - valid explicit `threadId` remains exact

2. App-level chat routing tests
   - creating a new thread from `/chats` keeps the requested thread route once the URL contains the created `threadId`
   - an explicit invalid `/chats?agentId=...&threadId=...` route renders not-found copy rather than opening another chat

## Non-Goals

- Changing the `/agents` chat route behavior
- Redesigning the chat layout
- Changing mobile vs desktop list/detail presentation beyond strict route resolution
