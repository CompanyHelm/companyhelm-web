# Chats Page Refactor Design

## Goal

Unify chat cards across AgentChatsPage and ChatsOverviewPage. Make cards minimal with icon-only actions. Simplify create-chat to a single input with optional settings modal.

## Shared Chat Card

Single row: title (bold) + running badge + open icon + trash icon.
Subtitle: timestamp, model, reasoning — all on one line, muted.
No chat ID shown. No text buttons.

Used in both AgentChatsPage and ChatsOverviewPage.

## Create Chat (AgentChatsPage)

Replace full form with single-line composer: text input + settings gear icon + send button.
Settings icon opens modal with Title + Additional Instructions fields.
Message text becomes first prompt after creation.

## AgentChatsPage Hero

Replace verbose hero (eyebrow, pills, subcopy) with minimal header:
Agent name (small muted), "Agent Chats" heading, back button.

## Files to Modify

- `src/pages/AgentChatsPage.jsx` — refactor cards, create flow, hero
- `src/pages/ChatsOverviewPage.jsx` — refactor chat session rows to match
- `src/index.css` — new card styles, create-chat composer styles
