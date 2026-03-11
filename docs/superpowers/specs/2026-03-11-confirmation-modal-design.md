# Confirmation Modal Design

## Summary

Replace every current `window.confirm(...)` usage in the frontend with a reusable modal component so destructive and high-impact actions use the app's existing dialog system instead of native browser popups.

## Current Context

- All current browser confirmation usage is concentrated in [`src/App.tsx`](/workspace/frontend/src/App.tsx).
- The repo already uses a shared modal primitive via [`src/components/CreationModal.tsx`](/workspace/frontend/src/components/CreationModal.tsx).
- The current confirmation flows gate company deletion, GitHub installation deletion, task deletion, skill and role deletion, secret and approval deletion, MCP server deletion, runner secret regeneration, runner deletion, and chat archive/delete actions.
- The current behavior is synchronous because each handler exits early when `window.confirm(...)` returns `false`.

## Goals

- Replace every current `window.confirm(...)` call in the frontend repo.
- Keep confirmation UX consistent through a single reusable component in [`src/components`](/workspace/frontend/src/components).
- Preserve the existing confirmation copy and mutation behavior for each action.
- Make it easy to add future confirmation flows without reintroducing native browser dialogs.

## Non-Goals

- No unrelated refactor of the large [`src/App.tsx`](/workspace/frontend/src/App.tsx) page logic.
- No confirmation provider or app-wide context layer unless the implementation proves a local helper is insufficient.
- No changes to non-confirmation modals already implemented elsewhere in the app.

## Approach

### Architecture

Add a dedicated `ConfirmationModal` component under [`src/components`](/workspace/frontend/src/components) that composes the existing modal layout conventions and exposes the small set of inputs the app needs:

- `isOpen`
- `title`
- `message`
- `confirmLabel`
- `cancelLabel`
- `tone` or equivalent destructive styling flag
- `isConfirming`
- `onConfirm`
- `onClose`

[`src/App.tsx`](/workspace/frontend/src/App.tsx) will own one piece of confirmation state plus a helper that turns modal interaction into an awaited boolean or callback-driven flow. Each existing `window.confirm(...)` site will switch to this helper rather than render its own bespoke modal.

### Data Flow

For each action that currently does:

1. build a confirmation string
2. call `window.confirm(...)`
3. return early on cancel
4. continue into existing mutation logic

the new flow becomes:

1. build the same confirmation message and metadata
2. open the shared `ConfirmationModal`
3. resolve cancel/close to "do nothing"
4. continue into the unchanged mutation logic only after explicit confirm

The confirm modal state remains centralized in [`src/App.tsx`](/workspace/frontend/src/App.tsx) because every current confirm call already lives there.

### UX Details

- The component should look like the rest of the app's modal system rather than a browser alert.
- Confirm and cancel actions should be explicit buttons in the modal footer.
- Escape and overlay click should cancel using the existing modal behavior unless a pending mutation needs temporary button disabling.
- Destructive actions should visually read as destructive through button styling and copy.
- Existing confirmation wording should be preserved so users still see the same warnings about cascading deletes, transcript removal, and runner secret regeneration.

### Error Handling

- Canceling or dismissing the modal must preserve current behavior: no mutation, no error state.
- Existing error/loading state in each handler remains the source of truth after confirmation resolves.
- The modal helper must guard against stale resolution if a new confirmation request is triggered before the previous one completes.

## Testing

- Add or update frontend tests to cover the reusable confirmation modal behavior.
- Add targeted coverage for the `App.tsx` confirm helper so cancel leaves the underlying handler untouched and confirm triggers the existing action path.
- Run the targeted test file first, then the relevant frontend test suite after implementation.
- Run a repo scan to verify there are no remaining `window.confirm(...)` calls in the frontend repository.

## Risks

- [`src/App.tsx`](/workspace/frontend/src/App.tsx) is large, so the main implementation risk is introducing awkward state coupling while swapping synchronous browser confirms for modal-driven flow.
- A poorly scoped helper could make concurrent confirmations ambiguous. Keeping a single active confirmation contract and clearing it deterministically reduces that risk.
