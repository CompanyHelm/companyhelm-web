# Chat Transcript Show All Design

## Goal

Let long transcript items in agent chats start in a compact form and expand inline with a per-message toggle.

## Current Problem

The transcript currently renders full message bodies for normal chat items and only offers `Show all` patterns in adjacent UI, such as queued messages and chat settings. Long transcript items can dominate the chat viewport and make adjacent messages harder to scan.

## Design

### Scope

Apply the behavior to all long transcript items rendered in the main chat transcript:

- user or human messages
- agent messages
- command execution items
- other transcript item types that share the same message row

Short transcript items remain unchanged.

### Expansion Behavior

Each long transcript item:

- starts collapsed to a fixed line clamp
- shows an inline `Show all` button below the message body
- expands only that message when clicked
- swaps the control to `Show less` after expansion
- collapses back inline without affecting scroll position more than the natural layout change

Expansion state is local to the selected chat session and resets when the session changes.

### Length Detection

Use the existing resolved transcript body text before rendering to determine whether an item is "long" enough to clamp. The threshold should be simple and deterministic so both markdown items and command items follow the same rule.

### Rendering

Keep the existing transcript item structure intact:

- resolve the item body text as today
- compute whether the item is long
- wrap the message content in a collapsed transcript class when needed
- render the inline toggle between the content and footer

This keeps existing markdown, code block, and footer behavior stable while adding only one new branch for long items.

### Styling

Add a reusable transcript clamp class in `src/index.css` that:

- applies a multi-line clamp to the rendered message content
- works for markdown and command output containers
- leaves expanded messages unmodified

Reuse the existing action-link styling pattern from chat settings and queued messages for the toggle button.

## Testing

Add a chat component test that proves:

- a long transcript item renders with `Show all`
- clicking `Show all` expands the full content inline and changes the control to `Show less`
- clicking `Show less` collapses the same item again
- a short transcript item does not render the toggle

## Non-Goals

- No modal or drawer for transcript expansion
- No persistence of expanded state across sessions or refreshes
- No special thresholds per transcript item role or type
