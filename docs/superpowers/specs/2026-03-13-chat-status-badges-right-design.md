# Chat Status Badges Right Of Title Design

## Summary

Move chat session status badges from the left side of each chat row to the right side of the chat title in:

- the agent chat page sidebar
- the chats overview list

Statuses covered by this change are `pending`, `error`, and `archived`. Existing transient badges such as `running`, `deleting`, and `archiving` should remain visually aligned with the same title row treatment where applicable.

## Current Problem

Both chat list UIs render status badges in a dedicated leading column before the chat title. This makes the status visually compete with the primary label and does not match the requested layout.

## Approved Behavior

- Chat titles render first.
- Status badges render inline on the right side of the title row.
- Long titles still truncate cleanly without pushing badges off-screen.
- Existing metadata, task summary, error copy, and action buttons remain unchanged.

## Design

### Title Row Layout

Introduce a shared title-row wrapper inside each chat card main section. The row should:

- use flex layout
- let the title text shrink and truncate
- keep the status badge visible on the right

### Agent Chat Sidebar

Move the status badge block from the leading `chat-card-status` container into the title row next to the title text in `AgentChatPage`.

### Chats Overview

Apply the same title-row structure to `ChatsOverviewPage` so both chat lists render title and status consistently.

### Styling

Add CSS for the title row and title text shrink behavior. Preserve existing badge styles and action button layout.

## Testing

Add targeted markup assertions for:

- agent chat sidebar status rendered after the chat title text
- chats overview status rendered after the chat title text
