# Mobile Chat Solid Background Design

**Date:** 2026-03-11

## Goal

Fix the mobile chat experience so the chat settings modal and chat list surfaces render with a solid background instead of inheriting a transparent panel style.

## Current Context

- The chat page mobile layout is styled in `src/index.css`.
- Mobile chat list variants are rendered from `src/pages/AgentChatPage.tsx` using:
  - `.chat-sidebar-panel-mobile-full`
  - `.chat-sidebar-panel-mobile-overlay`
- The chat settings UI is rendered in the same page through the shared modal card classes.
- A broad mobile rule under `.page-shell-chat-layout .panel` resets panel backgrounds to `transparent`, which leaks through to chat-specific mobile surfaces.

## Chosen Approach

Keep the existing mobile chat layout and modal structure, and add a targeted CSS override for the mobile chat list panels and mobile chat settings modal surface.

This keeps the behavior change local to the affected chat UI surfaces and avoids changing the general mobile chat layout styling for unrelated panels.

## Design Details

### Surface Styling

- Keep the existing mobile panel reset for the general chat layout.
- Re-apply a solid surface background to:
  - `.chat-sidebar-panel-mobile-full`
  - `.chat-sidebar-panel-mobile-overlay`
  - the fullscreen chat settings modal card
- Use the existing mobile modal surface color so the fix matches the current visual system instead of introducing a new token or one-off color.

### Scope

- Limit the fix to mobile chat list and chat settings surfaces.
- Do not change desktop chat styling.
- Do not change overlay scrim opacity, chat spacing, or modal sizing.

### Testing

- Add a focused frontend regression test that exercises the mobile chat settings surface class selection.
- Verify existing mobile chat page tests still pass.

## Out Of Scope

- Reworking the general mobile chat layout
- Introducing new theme variables
- Any API, routing, or state-management changes
