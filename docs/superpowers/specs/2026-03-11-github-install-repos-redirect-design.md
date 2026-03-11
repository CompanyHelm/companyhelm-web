# GitHub Install Repos Redirect Design

## Goal

Keep users on the repos page after the GitHub App installation callback is processed.

## Scope

- Change the frontend callback flow so it routes to `repos` instead of `settings`.
- Keep company selection and installation-linking behavior unchanged.
- Cover the callback cleanup redirect with a focused test.

## Design

The current callback handler in `src/App.tsx` immediately navigates to the settings page, and the callback cleanup utility in `src/utils/path.ts` also rewrites the URL to `/settings`. Both parts of the flow need to target the repos page so the browser location remains aligned with the repositories UI after setup completes.

## Testing

- Add a failing test for `clearGithubInstallCallbackFromLocation` in `tests/utils/path.test.ts`.
- Run the targeted test file, then the full frontend test suite.
