# Internal ID Display Cleanup Design

## Goal

Stop showing internal IDs in normal product UI. When a display name or title is missing, render a neutral placeholder instead of deriving one from the internal ID. Explicit internal IDs remain allowed only in clearly debug-oriented surfaces.

## Scope

This change applies to frontend display paths that currently:

- derive names from internal IDs in helpers or adapters
- fall back from entity names to internal IDs in normal UI
- show internal IDs directly in runner/chat/task product surfaces

This change does not remove external IDs that are intentionally shown as secondary metadata.

## Policy

Normal UI must never use internal IDs as primary or fallback display text.

Preferred neutral fallbacks:

- runners: `Unnamed runner`
- roles: `Unknown role`
- MCP servers: `Unknown MCP server`
- skills: `Unknown skill`
- skill groups: `Unknown skill group`
- secrets: `Unknown secret`
- agents: `Unnamed agent`
- tasks: `Untitled task`
- chats/threads: `Untitled chat`
- principals: `Unknown principal`

## Design

### Shared helper and adapter cleanup

Remove ID-derived display fallbacks from shared helpers and adapters first so new UI does not inherit the old behavior.

Affected areas include:

- runner label formatting
- chat/thread title normalization
- thread task summary normalization
- adapter-level entity name normalization where `name` or `title` is currently synthesized from an ID

Helpers should preserve missing labels as empty or null values when possible and let the UI choose the neutral fallback.

### UI surface cleanup

Update affected pages and components to use the neutral fallback policy consistently.

This includes:

- runner selectors and summaries
- approval cards
- agent role and MCP summaries
- task labels in tables, graphs, detail views, and relation pills
- comment author labels
- chat sidebar agent labels
- normal chat title displays

Explicit internal IDs should be removed from normal runner/chat/task surfaces. Debug-oriented surfaces can keep them.

### Testing

Add regression tests for:

- shared fallback helpers and adapter normalization
- task and chat labels that currently derive from IDs
- runner labels in normal UI
- neutral comment/principal fallback rendering

## Risks

- Existing tests may depend on ID-derived labels and will need to be updated.
- Some render paths may rely on helpers returning non-empty strings today. Those paths need explicit neutral fallbacks after helper cleanup.
- Chat/title normalization touches shared state assembly, so targeted tests are needed before and after implementation.
