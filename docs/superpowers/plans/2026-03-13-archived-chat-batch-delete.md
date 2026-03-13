# Archived Chat Batch Delete Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add checkbox-based multi-select and batch permanent delete for archived chats on both the single-agent archived chats page and the chats overview archived page.

**Architecture:** Keep the GraphQL/API contract unchanged and build the first version on top of the existing single-chat delete flow. Add shared archived-chat selection and batch-delete orchestration helpers in `src/utils`, then wire both page components to archived-mode-only checkbox toolbars and a new App-level batch-delete callback that performs one bulk confirmation and sequential deletes with partial-failure reporting.

**Tech Stack:** React 18, TypeScript, Vite, Node test runner via `tsx --test`

---

## File Structure

- Create: `src/utils/archivedChatSelection.ts`
  Responsibility: shared archived-chat selection keys, select-all state, deselect/prune helpers, and sequential batch-delete orchestration helpers.
- Modify: `src/App.tsx`
  Responsibility: extend chat delete flow with optional confirmation skipping, add App-level archived batch delete handler, and pass new bulk-delete props into both chat list pages.
- Modify: `src/pages/AgentChatsPage.tsx`
  Responsibility: render archived-only selection toolbar and row checkboxes, maintain page-local selection state, and call the App batch-delete callback.
- Modify: `src/pages/ChatsOverviewPage.tsx`
  Responsibility: render archived-only selection toolbar and row checkboxes across the multi-agent overview, maintain page-local selection state, and call the App batch-delete callback.
- Modify: `src/index.css`
  Responsibility: add layout and state styles for archived selection toolbars, row checkboxes, and disabled bulk actions while preserving current chat card layout.
- Test: `tests/utils/archived-chat-selection.test.ts`
  Responsibility: cover selection helpers and sequential batch-delete result aggregation.
- Modify: `tests/chat/agent-chats-page-actions.test.ts`
  Responsibility: verify archived-mode toolbar and row checkbox markup for the single-agent page.
- Modify: `tests/chat/chats-overview-page-actions.test.ts`
  Responsibility: verify archived-mode toolbar and row checkbox markup for the overview page.

## Chunk 1: Shared archived chat helpers

### Task 1: Cover archived selection helpers

**Files:**
- Create: `tests/utils/archived-chat-selection.test.ts`
- Create: `src/utils/archivedChatSelection.ts`

- [ ] **Step 1: Write the failing selection helper tests**

```ts
test("ArchivedChatSelection creates stable chat keys and toggles individual selection", () => {
  const key = ArchivedChatSelection.getKey("agent-1", "thread-1");
  assert.equal(key, "agent-1:thread-1");

  const selected = ArchivedChatSelection.toggle(new Set<string>(), key, true);
  assert.deepEqual([...selected], [key]);
});

test("ArchivedChatSelection toggles all visible chats and prunes deleted ones", () => {
  const visibleKeys = ["agent-1:thread-1", "agent-1:thread-2"];
  const allSelected = ArchivedChatSelection.setAll(new Set<string>(), visibleKeys, true);
  assert.deepEqual([...allSelected].sort(), visibleKeys);

  const pruned = ArchivedChatSelection.clearKeys(allSelected, ["agent-1:thread-1"]);
  assert.deepEqual([...pruned], ["agent-1:thread-2"]);
});

test("ArchivedChatSelection reports all-selected state from visible keys", () => {
  const summary = ArchivedChatSelection.getSummary(
    new Set<string>(["agent-1:thread-1", "agent-1:thread-2"]),
    ["agent-1:thread-1", "agent-1:thread-2"],
  );
  assert.equal(summary.selectedCount, 2);
  assert.equal(summary.allVisibleSelected, true);
});
```

- [ ] **Step 2: Run the selection helper test to verify it fails**

Run: `npm test -- tests/utils/archived-chat-selection.test.ts`

Expected: FAIL because `src/utils/archivedChatSelection.ts` and `ArchivedChatSelection` do not exist yet.

- [ ] **Step 3: Write the minimal selection helper implementation**

```ts
export class ArchivedChatSelection {
  static getKey(agentId: string, sessionId: string) {
    return `${String(agentId || "").trim()}:${String(sessionId || "").trim()}`;
  }

  static toggle(current: Set<string>, key: string, shouldSelect: boolean) {
    const next = new Set(current);
    if (shouldSelect) next.add(key);
    else next.delete(key);
    return next;
  }
}
```

Add the remaining `setAll`, `clearKeys`, and `getSummary` methods in the same file with the smallest logic needed to satisfy the tests.

- [ ] **Step 4: Run the selection helper test to verify it passes**

Run: `npm test -- tests/utils/archived-chat-selection.test.ts`

Expected: PASS with all selection helper assertions green.

- [ ] **Step 5: Commit**

```bash
git add tests/utils/archived-chat-selection.test.ts src/utils/archivedChatSelection.ts
git commit -m "test: cover archived chat selection helpers"
```

### Task 2: Cover sequential batch-delete aggregation

**Files:**
- Modify: `tests/utils/archived-chat-selection.test.ts`
- Modify: `src/utils/archivedChatSelection.ts`

- [ ] **Step 1: Write the failing batch-delete aggregation test**

```ts
test("ArchivedChatSelection batch delete runner continues after failures and reports both results", async () => {
  const result = await ArchivedChatSelection.runBatchDelete(
    [
      { agentId: "agent-1", sessionId: "thread-1", title: "One" },
      { agentId: "agent-1", sessionId: "thread-2", title: "Two" },
    ],
    async ({ sessionId }) => sessionId === "thread-1",
  );

  assert.deepEqual(result.deletedKeys, ["agent-1:thread-1"]);
  assert.deepEqual(result.failedKeys, ["agent-1:thread-2"]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/utils/archived-chat-selection.test.ts`

Expected: FAIL because `runBatchDelete` is not implemented yet.

- [ ] **Step 3: Write the minimal batch-delete runner**

```ts
static async runBatchDelete(entries, deleteChat) {
  const deletedKeys = [];
  const failedKeys = [];
  for (const entry of entries) {
    const didDelete = await deleteChat(entry);
    const key = ArchivedChatSelection.getKey(entry.agentId, entry.sessionId);
    if (didDelete) deletedKeys.push(key);
    else failedKeys.push(key);
  }
  return { deletedKeys, failedKeys };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/utils/archived-chat-selection.test.ts`

Expected: PASS with both helper and batch-delete tests green.

- [ ] **Step 5: Commit**

```bash
git add tests/utils/archived-chat-selection.test.ts src/utils/archivedChatSelection.ts
git commit -m "feat: add archived chat batch delete helpers"
```

## Chunk 2: Archived page selection UI

### Task 3: Cover `AgentChatsPage` archived batch-delete markup

**Files:**
- Modify: `tests/chat/agent-chats-page-actions.test.ts`
- Modify: `src/pages/AgentChatsPage.tsx`

- [ ] **Step 1: Write the failing archived markup test**

```ts
test("AgentChatsPage archived mode renders batch selection controls", () => {
  const markup = renderAgentChatsPageMarkup({
    chatListStatusFilter: "archived",
    selectedArchivedChatKeys: new Set(["agent-1:thread-1"]),
    onBatchDeleteChats: async () => ({ deletedKeys: [], failedKeys: [] }),
  });

  assert.match(markup, /aria-label="Select all archived chats"/);
  assert.match(markup, /aria-label="Select archived chat Thread 1"/);
  assert.match(markup, />1 selected</);
  assert.match(markup, />Deselect all</);
  assert.match(markup, />Delete selected</);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/chat/agent-chats-page-actions.test.ts`

Expected: FAIL because the page does not render archived selection UI or accept the new props yet.

- [ ] **Step 3: Implement the minimal archived selection toolbar and row checkboxes**

Add page-local `useState(new Set())` selection, derive visible archived keys with `useMemo`, render the archived toolbar only when `chatListStatusFilter === "archived"`, and add row checkboxes that stop propagation.

- [ ] **Step 4: Run the page test to verify it passes**

Run: `npm test -- tests/chat/agent-chats-page-actions.test.ts`

Expected: PASS with archived selection markup rendered and active-mode create actions still covered by existing tests.

- [ ] **Step 5: Commit**

```bash
git add tests/chat/agent-chats-page-actions.test.ts src/pages/AgentChatsPage.tsx
git commit -m "feat: add archived batch selection to agent chats page"
```

### Task 4: Cover `ChatsOverviewPage` archived batch-delete markup

**Files:**
- Modify: `tests/chat/chats-overview-page-actions.test.ts`
- Modify: `src/pages/ChatsOverviewPage.tsx`

- [ ] **Step 1: Write the failing archived overview markup test**

```ts
test("ChatsOverviewPage archived mode renders cross-agent batch selection controls", () => {
  const markup = renderChatsOverviewPageMarkup({
    chatListStatusFilter: "archived",
    agents: [
      { id: "agent-1", name: "Build Agent", agentSdk: "codex", model: "gpt-5" },
      { id: "agent-2", name: "Review Agent", agentSdk: "codex", model: "gpt-5" },
    ],
    chatSessionsByAgent: {
      "agent-1": [{ id: "thread-1", title: "Archived thread", status: "archived", updatedAt: "2026-03-08T00:00:00.000Z" }],
      "agent-2": [{ id: "thread-2", title: "Second archived thread", status: "archived", updatedAt: "2026-03-08T00:00:00.000Z" }],
    },
    onBatchDeleteChats: async () => ({ deletedKeys: [], failedKeys: [] }),
  });

  assert.match(markup, /aria-label="Select all archived chats"/);
  assert.match(markup, /aria-label="Select archived chat Archived thread"/);
  assert.match(markup, /aria-label="Select archived chat Second archived thread"/);
  assert.match(markup, />Delete selected</);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/chat/chats-overview-page-actions.test.ts`

Expected: FAIL because the overview page does not render archived batch-selection markup yet.

- [ ] **Step 3: Implement the minimal overview batch-selection toolbar and row checkboxes**

Use the same helper class to compute all visible archived keys across agents, add a single archived toolbar above the agent list, and render row checkboxes that do not trigger chat navigation.

- [ ] **Step 4: Run the page test to verify it passes**

Run: `npm test -- tests/chat/chats-overview-page-actions.test.ts`

Expected: PASS with cross-agent archived selection markup rendered while active-mode markup remains unchanged.

- [ ] **Step 5: Commit**

```bash
git add tests/chat/chats-overview-page-actions.test.ts src/pages/ChatsOverviewPage.tsx
git commit -m "feat: add archived batch selection to chats overview"
```

### Task 5: Add archived selection styles

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add the minimal CSS for archived selection layout**

Add styles for:

- archived chat selection toolbar container
- selected-count text
- row checkbox alignment in both page layouts
- spacing for `Deselect all` and `Delete selected`
- disabled bulk-action state

- [ ] **Step 2: Run the relevant page tests**

Run: `npm test -- tests/chat/agent-chats-page-actions.test.ts tests/chat/chats-overview-page-actions.test.ts`

Expected: PASS because CSS changes should not alter the tested markup structure.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: add archived batch selection layout"
```

## Chunk 3: App-level bulk delete integration

### Task 6: Extend the existing delete flow for batch execution

**Files:**
- Modify: `src/App.tsx`
- Modify: `tests/utils/archived-chat-selection.test.ts`

- [ ] **Step 1: Write the failing orchestration test**

Add a unit test in `tests/utils/archived-chat-selection.test.ts` that proves the batch-delete runner:

- keeps processing after a failed delete
- returns deleted and failed keys separately
- preserves call order for sequential execution

- [ ] **Step 2: Run the helper test to verify it fails for the missing behavior**

Run: `npm test -- tests/utils/archived-chat-selection.test.ts`

Expected: FAIL because the runner does not yet assert or expose sequential result details needed by the App integration.

- [ ] **Step 3: Implement the App integration**

In `src/App.tsx`:

- extend `handleDeleteChatSession` to accept `skipConfirmation?: boolean`
- bypass `requestConfirmation` when `skipConfirmation` is true
- add `handleBatchDeleteChats(entries)` that:
  - opens one bulk confirmation using `requestConfirmation`
  - calls `ArchivedChatSelection.runBatchDelete(...)` with `skipConfirmation: true`
  - sets `chatError` and `chatIndexError` to one summary error when failures occur
  - clears existing chat errors before a successful batch run
- pass `onBatchDeleteChats` and `isBatchDeletingChats` props to both pages

- [ ] **Step 4: Run the targeted tests**

Run: `npm test -- tests/utils/archived-chat-selection.test.ts tests/chat/agent-chats-page-actions.test.ts tests/chat/chats-overview-page-actions.test.ts`

Expected: PASS with helper and page coverage green after App wiring.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/pages/AgentChatsPage.tsx src/pages/ChatsOverviewPage.tsx tests/utils/archived-chat-selection.test.ts
git commit -m "feat: wire archived chat batch delete flow"
```

### Task 7: Run broader frontend verification

**Files:**
- Modify: none unless failures require fixes

- [ ] **Step 1: Run the frontend chat test suite**

Run: `npm test -- tests/chat/*.test.ts`

Expected: PASS with no regressions in archived chat behavior, overview behavior, or sidebar actions.

- [ ] **Step 2: Run the full frontend test suite**

Run: `npm test`

Expected: PASS with the entire frontend test suite green.

- [ ] **Step 3: Run a production build**

Run: `npm run build`

Expected: PASS with a successful Vite production build.

- [ ] **Step 4: Commit any verification-driven fixes**

```bash
git add .
git commit -m "fix: address archived chat batch delete verification feedback"
```

## Review Notes

No code-review or plan-review subagent is available in this harness. Use manual review checkpoints after each chunk:

- re-read the matching section in `docs/superpowers/specs/2026-03-13-archived-chat-batch-delete-design.md`
- confirm the chunk still follows YAGNI and keeps API scope frontend-only
- confirm tests exercise the new behavior before implementation changes

