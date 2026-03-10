# Archived Tab Thread Creation Design

## Goal

Prevent users from creating new chat threads while viewing the archived tab in the chats UI.

## Current Problem

The chats UI exposes `New chat` controls in archived mode across both the agent chats page and the single-agent chat page. Those controls allow users to start a new thread even when the page context is explicitly filtered to archived conversations.

## Design

### Scope

Apply the change to every `New chat` affordance that is rendered from the current chat list filter:

- the agent chats page toolbar
- the agent chat page desktop sidebar
- the agent chat page mobile sidebar and empty-state variants

### Archived Mode Behavior

When `chatListStatusFilter` resolves to `archived`:

- do not render any `New chat` button
- do not render chat-creation settings controls that only exist to configure a new thread
- keep archive/delete/open actions for archived sessions unchanged

When the filter resolves to `active`, current creation behavior remains unchanged.

### Implementation Shape

Reuse the existing normalized list filter checks already present in both pages. Add a small boolean guard for "can show create actions" and use it to conditionally render the creation controls without changing the underlying create handlers.

This keeps the behavior aligned with the current page state and avoids introducing duplicate validation paths for a UI action that should not be presented in archived mode.

## Testing

Add render coverage that proves:

- archived mode on `AgentChatPage` renders no `New chat` action
- archived mode on `AgentChatsPage` renders no `New chat` action
- active mode still renders the expected creation affordance

## Non-Goals

- No backend restriction changes
- No changes to archive, delete, or transcript behavior
- No new empty-state copy for archived mode
