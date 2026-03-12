# Contributing

## App Structure

- Keep `src/App.tsx` minimal. It should compose routes, shared providers, and high-level wiring rather than accumulate feature workflow details.
- When a feature adds meaningful UI state, validation, or orchestration, move it into dedicated components, hooks, or utility modules instead of extending `App.tsx` inline.
- If the same user flow appears in more than one surface, prefer a shared component with surface-specific wiring around it.

## Frontend Changes

- Follow the existing React and TypeScript patterns in the repo.
- Add focused tests for new behavior before or alongside implementation changes.
- Keep files scoped to one responsibility when possible so future changes do not need to thread through large page files or the app shell.
