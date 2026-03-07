# Chat Transcript Loading Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the transient false empty state in agent chat with a centered loading state, then show a richer empty state with static starter prompts once the transcript query resolves with zero messages.

**Architecture:** Keep the existing transcript rendering logic intact and only change the branch that handles "loading with no transcript" versus "loaded with no transcript". Extract the empty-state prompt list into a small pure component/helper so it can be tested without browser tooling.

**Tech Stack:** React, TypeScript, Vite, Node test runner (`tsx --test`), CSS

---

### Task 1: Add Failing Chat State Tests

**Files:**
- Create: `tests/chat/agent-chat-loading-state.test.ts`

1. Write a failing render test for `AgentChatPage` that expects `Loading messages...` to appear while `isLoadingChat` is true and no transcript exists.
2. Write a failing render test that expects the resolved empty state copy and the static prompt suggestions once `isLoadingChat` is false and no transcript exists.
3. Write a failing interaction test for the extracted empty-state component/helper that verifies clicking a prompt suggestion sends the prompt text into the existing draft handler.
4. Run `npm test -- tests/chat/agent-chat-loading-state.test.ts` and confirm the new assertions fail for the expected reasons.

### Task 2: Implement Chat Loading and Empty State UI

**Files:**
- Modify: `src/pages/AgentChatPage.tsx`
- Modify: `src/index.css`

1. Add a centered chat loading block for the `isLoadingChat && !hasTranscriptContent` branch.
2. Replace the plain empty hint with an empty-state block that renders the static suggestion buttons.
3. Wire prompt suggestion clicks to `onChatDraftMessageChange(...)` and focus `#chat-message-input`.
4. Add scoped CSS for the centered loading state and prompt suggestion layout, reusing existing spinner styles where possible.

### Task 3: Verify the Feature

1. Run `npm test -- tests/chat/agent-chat-loading-state.test.ts`.
2. Run `npm test`.
3. Run `npm run build`.
4. Start the frontend locally with `npm run dev` and verify it boots without runtime errors.

### Task 4: Finish the Branch

1. Review the diff for accidental regressions.
2. Fetch and rebase onto `origin/main`.
3. Commit the docs, tests, and implementation.
4. Push `fix/chat-thread-loading-state`.
5. Open a PR with a concise summary and wait for checks to pass.
