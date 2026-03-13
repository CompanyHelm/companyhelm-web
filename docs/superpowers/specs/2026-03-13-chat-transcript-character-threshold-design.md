# Chat Transcript Character Threshold Design

## Goal

Replace the current estimated-line heuristic for chat transcript collapsing with a single character-count threshold.

## Scope

Apply the new threshold to transcript items rendered in the main agent chat transcript that already support the inline `Show all` / `Show less` toggle.

Included item types:

- agent messages
- user messages
- command execution items
- other transcript items that render through the shared transcript row path

## Behavior

- A transcript item is considered long when its resolved body text exceeds `1000` characters after the existing string normalization used by the transcript renderer.
- Long transcript items render in the existing collapsed form with the existing inline `Show all` button.
- Expanding and collapsing remain per-item and session-local, using the current `expandedTranscriptItemIds` state.
- Short transcript items remain unchanged.

## Rendering

Keep the current transcript rendering structure intact:

- continue resolving transcript body text with `resolveChatItemBodyText`
- replace the estimated wrapped-line calculation with a simple character threshold helper
- keep the existing clamped CSS class and inline toggle placement

This limits the change to the long-message detection logic and avoids layout or state-management changes.

## Testing

Update the agent chat transcript tests to cover the new threshold:

- a transcript item with more than `1000` characters renders `Show all`
- a transcript item with `1000` characters or fewer does not render the toggle
- command execution items continue to participate in the same shared threshold behavior

## Error Handling And Edge Cases

- Empty or whitespace-only transcript bodies should not be treated as long
- Placeholder transcript bodies returned by the existing resolver still use the same shared threshold logic
- No persistence changes are needed for expanded state

## Non-Goals

- No role-specific thresholds
- No CSS redesign for collapsed transcript rows
- No persistence of expansion state across refreshes or sessions
