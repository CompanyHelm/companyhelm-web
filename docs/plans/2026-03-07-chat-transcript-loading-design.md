# Chat Transcript Loading Design

## Goal

Prevent the chat page from showing a false "No messages yet" state while the transcript GraphQL query is still loading, especially during thread switches.

## Current Problem

When the selected thread changes, the UI can briefly render an empty-state hint before the transcript query resolves. That implies the thread is empty even though message data is simply not loaded yet.

## Design

### Loading State

Render a centered loading state inside the chat panel whenever all of the following are true:

- a chat session is selected
- the transcript query is still loading
- there is no loaded transcript content yet
- the session is not deleting

The loading state includes:

- a spinner that matches existing chat spinner styling
- the copy `Loading messages...`

### Empty State

After the transcript query resolves:

- show the transcript if messages exist
- otherwise show an empty state

The empty state includes:

- `No messages yet. Start with one of these prompts.`
- a static set of prompt suggestion buttons

Initial prompt suggestions:

- `Summarize this repository`
- `Find the most likely bug in this codebase`
- `Write an implementation plan for the next feature`
- `Explain how this project is structured`

Clicking a suggestion populates the existing composer draft and focuses the composer input.

## Non-Goals

- No agent-specific prompt generation
- No skeleton transcript rows
- No overlay on top of an already-rendered transcript
