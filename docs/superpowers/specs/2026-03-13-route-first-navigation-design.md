# Route-First Navigation Design

## Summary

Standardize in-app navigation so clicks update the URL immediately and the destination route owns loading behavior. Users should never wait on GraphQL bootstrap work before the app changes routes.

## Current Problem

Most frontend routes already navigate immediately through `setBrowserPath(...)`, but chats still uses async pre-navigation logic in `navigateToChatsConversation(...)`. That flow can wait on chat bootstrap data before pushing `/chats`, which makes the click feel hung.

The requested behavior is consistent across the app:

- clicking a route should move to that route immediately
- the destination page should show its own loader if its data is not ready yet
- no shared app-level navigation spinner should be added

## Approved Behavior

- All internal route clicks update browser state immediately.
- Route handlers do not await GraphQL bootstrap work before navigation.
- Destination pages keep responsibility for their own loading, empty, error, and not-found states.
- Existing page-level loading copy remains the source of truth unless a destination route is missing a necessary loader.
- Route correction and fallback happen after navigation, during route reconciliation, not before navigation.

## Design

### Navigation Model

Keep route changes route-first across the app:

- click handlers should push the destination route immediately
- route-local state that would otherwise leak stale content from the previous page may be cleared at navigation time
- data resolution should happen after the new route is active

This does not require a new routing layer. The current browser-history model remains in place.

### Chats Route Reconciliation

Split the current chats navigation behavior into two concerns:

1. Click-time navigation
   - navigate immediately to `/chats` or `/chats?agentId=...&threadId=...`
   - do not await `loadChatsBootstrapData(...)`

2. Route-time reconciliation
   - once the chats route is active, existing route and data effects determine whether the requested agent and thread exist
   - if chats index data is still loading, the chats page remains active and shows its current loading state
   - after data resolves, the route may settle on list view, a requested thread, or an existing fallback like `/agents` or `/settings`

For `/chats`, expected outcomes are:

- `/chats`
  - render the chats route immediately
  - show the destination page loader while chat index data resolves
  - once data is available, keep existing compact-vs-desktop behavior for whether the first thread is auto-opened
- `/chats?agentId=...`
  - render the chats route immediately
  - show current chats loading or empty state while sessions for that agent resolve
- `/chats?agentId=...&threadId=...`
  - render the destination chat page immediately
  - show the transcript loader until the thread payload resolves

### Other Route Clicks

Keep the current immediate-navigation behavior for routes that already push browser state synchronously, including detail routes such as:

- `/tasks/:id`
- `/skills/:id`
- `/roles/:id`
- `/gitSkillPackages/:id`
- `/agent-runner/:id`
- `/agents/:id`

Audit route-opening handlers and normalize any remaining cases that mix route changes with async preparation so they follow the same route-first rule.

### Error Handling And Fallbacks

- If no company is selected, navigation to chats still resolves to `/settings`, but only after the app reaches the chats route and runs reconciliation.
- If a requested chat agent or thread is missing, current missing-target suppression should remain in effect while the chat index is still loading.
- Once data finishes loading, invalid targets should fall back cleanly instead of leaving the route in a suspended state.
- Route changes should clear stale chat transcript state so the destination loader appears instead of previous-thread content.
- No extra prefetching or inactive-route background fetching should be introduced.

### Structure

Keep the change localized to the frontend route orchestration that already exists:

- `src/App.tsx` remains responsible for route parsing, active-page selection, and chat navigation orchestration
- helper extraction is acceptable if chat route reconciliation becomes hard to reason about in-place
- do not add a centralized global navigation loader or a second navigation state machine

### Testing

Add or update focused frontend tests to cover:

- clicking or invoking chat navigation updates the route before bootstrap data resolves
- chats route shows destination-owned loading states while index or transcript data is unresolved
- missing route targets still fall back correctly after loading completes
- existing immediate-navigation routes do not regress

Also review `companyhelm-common` system tests for any assertions that assume the old blocking chats navigation behavior. Update them only if the shared e2e coverage actually depends on that timing.

## Non-Goals

- Introducing a global route transition spinner
- Adding speculative route prefetching
- Replacing the existing browser-history routing model
- Changing GraphQL schema behavior for chat bootstrap or route data
