# Mobile Confirmation Modal Background Design

## Summary

Fix mobile confirmation modals opened from chat pages so their dialog surface stays opaque instead of inheriting the chat layout's transparent panel background.

## Current Context

- Confirmation dialogs reuse `CreationModal`, which renders the dialog card with both `panel` and `modal-card` classes.
- Mobile chat pages intentionally make generic `.panel` surfaces transparent inside `.page-shell-chat-layout`.
- That chat-specific override is more specific than the shared mobile modal background rule, so confirmation dialogs like thread delete appear fully transparent on mobile.

## Goals

- Keep confirmation modal cards opaque on mobile chat pages.
- Preserve the transparent mobile treatment for chat panels that are meant to blend into the layout.
- Add a regression test that fails if chat-layout modal cards lose their background again.

## Non-Goals

- No refactor of modal components or modal state.
- No change to desktop modal styling.
- No change to the mobile chat panel transparency behavior outside modal cards.

## Approach

### Architecture

Keep the fix in CSS. The mobile chat layout override should continue to target generic `.panel` surfaces, but modal card variants inside `.page-shell-chat-layout` need a more specific rule that restores the standard modal background.

### Testing

- Add a CSS regression test that reads `src/index.css` and asserts mobile chat layout modal cards are explicitly assigned the shared opaque background.
- Run that targeted test first so the red-green cycle proves the regression coverage is real.
- Re-run the confirmation modal markup test alongside the new CSS test after the style update.

## Risks

- A too-broad selector could accidentally affect intentionally transparent chat surfaces.
- A too-narrow selector could fix only one modal variant and leave wide or fullscreen cards exposed to the same regression.
