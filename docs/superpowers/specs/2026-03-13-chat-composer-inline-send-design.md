# Chat Composer Inline Send Button Design

## Summary

Move the idle chat composer send button onto the same horizontal row as the message textarea, aligned to the right of the input, on both desktop and mobile layouts.

## Current Problem

The idle composer currently stacks the textarea above the send button. That adds vertical space and does not match the requested chat layout.

## Approved Behavior

- The idle chat composer renders the textarea and send button on one row.
- The send button stays right-aligned beside the textarea on desktop and mobile.
- The running-state composer layout remains unchanged.
- Existing send, disabled, loading, keyboard submit, and expand-editor behaviors remain unchanged.

## Design

### Idle Composer Layout

Keep the existing `AgentChatPage` composer markup. Change only the idle-state layout rules so the input row stays horizontal, the textarea wrapper grows to fill available width, and the toolbar shrinks to the send button width.

### Mobile Behavior

Apply the same inline idle layout inside the mobile breakpoint so the send button remains on the same row as the textarea instead of dropping below it.

### Styling Boundaries

Limit the implementation to `src/index.css`. Preserve the running-state stacked layout and existing button styling to avoid unrelated visual regressions.

## Testing

Add a focused stylesheet test that asserts the idle composer row is horizontal in the base rules and remains horizontal in the mobile breakpoint.
