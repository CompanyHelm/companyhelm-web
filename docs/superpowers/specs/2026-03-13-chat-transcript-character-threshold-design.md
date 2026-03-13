# Chat Transcript Wrapped Line Threshold Design

## Goal

Restore the chat transcript collapse heuristic based on estimated wrapped lines and raise the collapse threshold from `8` to `30` wrapped lines.

## Scope

Apply the wrapped-line threshold to transcript items rendered in the main agent chat transcript that already support the inline `Show all` / `Show less` toggle.

Included item types:

- agent messages
- user messages
- command execution items
- other transcript items that render through the shared transcript row path

## Behavior

- A transcript item is considered long when its resolved body text exceeds `30` estimated wrapped lines after the existing string normalization used by the transcript renderer.
- Estimated wrapped lines should use the original `72` characters-per-line approximation from the first transcript toggle implementation.
- Long transcript items render in the existing collapsed form with the existing inline `Show all` button.
- Expanding and collapsing remain per-item and session-local, using the current `expandedTranscriptItemIds` state.
- Short transcript items remain unchanged.

## Rendering

Keep the current transcript rendering structure intact:

- continue resolving transcript body text with `resolveChatItemBodyText`
- use the wrapped-line heuristic from commit `1adcca2`
- change only the collapse threshold from `8` to `30`
- keep the existing clamped CSS class and inline toggle placement

This keeps the old behavior model intact and limits the change to the threshold value.

## Testing

Update the agent chat transcript tests to cover the restored threshold:

- a transcript item with `31` explicit short lines renders `Show all`
- a transcript item with `30` explicit short lines does not render the toggle
- command execution items continue to participate in the same wrapped-line heuristic

## Error Handling And Edge Cases

- Empty or whitespace-only transcript bodies should not be treated as long
- Placeholder transcript bodies returned by the existing resolver still use the same shared heuristic
- No persistence changes are needed for expanded state

## Non-Goals

- No role-specific thresholds
- No CSS redesign for collapsed transcript rows
- No persistence of expansion state across refreshes or sessions
