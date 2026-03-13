# Overview Archiving Badge Design

## Goal

Show an `archiving` badge in the cross-agent chats overview list when a thread is actively being archived, using the same right-side status area that already shows `running`, `pending`, `deleting`, `archived`, and `error`.

## Scope

Limit the change to `ChatsOverviewPage`.

Do not refactor shared status badge rendering.

Do not change archive mutation behavior, backend contracts, or the agent-specific chat list and thread views, which already render `archiving`.

## Existing Gap

`AgentChatsPage` and `AgentChatPage` already recognize archiving in two ways:

- the persisted session status is `archiving`
- the local in-flight key matches `archivingChatSessionKey`

`ChatsOverviewPage` currently only renders `pending`, `deleting`, `archived`, and `error`, so overview rows can miss the transient archive state while other thread lists already show it.

## Proposed Change

Add an optional `archivingChatSessionKey` prop to `ChatsOverviewPage` so the view can reflect local in-flight archive work when a caller provides it.

For each overview row, compute `isArchivingChat` when either of these is true:

- `chatSession.status` normalizes to `archiving`
- the row key matches `archivingChatSessionKey`

When the row is not `running`, render an `archiving` badge in the existing status badge slot on the right. Reuse the current transient-status styling already used by other pages for `archiving`.

## Testing

Add focused render coverage for `ChatsOverviewPage` that verifies:

- a row with `status: "archiving"` renders the `archiving` badge
- a row with a matching `archivingChatSessionKey` renders the `archiving` badge even if the stored status has not updated yet

No e2e changes are expected because this is a frontend-only consistency fix and the shared system tests do not assert overview-specific archiving badge text today.
