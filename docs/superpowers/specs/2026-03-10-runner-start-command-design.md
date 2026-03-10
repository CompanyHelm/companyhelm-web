# Runner Start Command Design

## Summary

Update user-facing helper code that shows how to start an agent runner so it uses `companyhelm runner start --secret <RUNNER_SECRET>` instead of the legacy top-level command form.

## Current Context

- The runner detail page renders a CLI helper command via `buildRunnerStartCommand` in `src/utils/shell.ts`.
- `src/pages/AgentRunnerDetailPage.tsx` already consumes that helper, so the command string has a single frontend source of truth.
- `tests/utils/shell.test.ts` currently asserts the legacy command output.
- A repo scan across the checked-out CompanyHelm repositories found the stale user-facing command only in this frontend helper/test path. The CLI repository already uses `companyhelm runner start`.

## Goals

- Replace the displayed helper command everywhere in the frontend with `companyhelm runner start --secret ...`.
- Keep command generation centralized in the shared shell helper.
- Preserve existing shell argument quoting behavior.
- Add regression coverage for the new command form.

## Non-Goals

- No UI layout or styling changes.
- No compatibility mode for both old and new commands.
- No CLI or API behavior changes, because the runtime command already exists in the CLI repository.

## Approach

### Architecture

Keep `src/utils/shell.ts` as the single source of truth for runner launch commands. The page continues to render the helper output without duplicating command tokens inline.

### Data Flow

The input remains the same:

- `runnerSecret` is sourced from the runner detail page state.
- `buildRunnerStartCommand` receives the secret and returns a shell-safe command string.

Only the emitted command tokens change to:

- `companyhelm runner start --secret <secret>`

### Error Handling

Existing quoting through `quoteShellArg` stays unchanged so secrets with spaces or shell-sensitive characters remain escaped consistently.

## Testing

- Update `tests/utils/shell.test.ts` to assert the new command output.
- Run the targeted frontend test first to verify the test fails before implementation.
- Run the same targeted test after implementation to verify green.
- Run a repo-wide grep across the checked-out repositories to confirm no stale legacy command references remain in source/tests/docs relevant to this request.

## Risks

- The only meaningful risk is leaving another stale user-facing reference behind. The repo-wide search mitigates that.
