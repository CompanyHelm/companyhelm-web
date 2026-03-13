import assert from "node:assert/strict";
import test from "node:test";
import { ArchivedChatSelection } from "../../src/utils/archivedChatSelection.ts";

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

test("ArchivedChatSelection batch delete runner continues after failures and reports both results", async () => {
  const result = await ArchivedChatSelection.runBatchDelete(
    [
      { agentId: "agent-1", sessionId: "thread-1", title: "One" },
      { agentId: "agent-1", sessionId: "thread-2", title: "Two" },
    ],
    async ({ sessionId }: { sessionId: string }) => sessionId === "thread-1",
  );

  assert.deepEqual(result.deletedKeys, ["agent-1:thread-1"]);
  assert.deepEqual(result.failedKeys, ["agent-1:thread-2"]);
});

test("ArchivedChatSelection formats a partial-failure summary message", () => {
  assert.equal(
    ArchivedChatSelection.getBatchDeleteSummaryMessage(3, 2),
    "3 chats deleted, 2 failed.",
  );
});
