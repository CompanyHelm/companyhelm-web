# Agent Chat Header Refactor Design

## Goal

Replace the verbose multi-panel header on the agent chat page with a minimal single-row header and a settings modal.

## Current State

The page has 3 sections above the chat transcript:
1. Context panel: "Agent Runtime" eyebrow, "Agent chat" heading, company/agent pills, Back/Delete/Hide buttons
2. Session panel: inline-editable chat title, collapsible settings (thread ID, model, reasoning, instructions)
3. Chat panel: transcript + composer

## New Design

### Minimal Header

Single row replacing both context and session panels:

- Agent name as small muted eyebrow text
- Chat title as primary bold text (shows "Untitled chat" if empty)
- Running badge inline if turn is active
- Trash icon button to delete chat
- Gear icon button to open settings modal
- No "Back to chats" (breadcrumbs handle navigation)
- No "Agent Runtime" label, no company/agent ID pills

### Settings Modal

Uses existing `CreationModal` component:

- **Editable fields**: Title (input, max 100 chars), Additional instructions (textarea)
- **Read-only info**: Thread ID, Model, Reasoning level
- Save button commits changes and closes modal
- Escape/click-outside closes without saving

### State Removed

- `isContextPanelCollapsed` / `isSessionPanelCollapsed` (no collapsible panels)
- `isEditingChatTitle` (editing moves to modal)
- Inline title editing form and handlers

### Files to Modify

- `src/pages/AgentChatPage.jsx` — main refactor
- `src/index.css` — new header styles, remove old panel styles
