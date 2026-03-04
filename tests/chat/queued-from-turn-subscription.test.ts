import assert from "node:assert/strict";
import test from "node:test";
import { updateQueuedMessagesFromTurnSubscription } from "../../src/utils/chat.ts";

test("updateQueuedMessagesFromTurnSubscription drops the oldest queued message on new running turn", () => {
  const result = updateQueuedMessagesFromTurnSubscription({
    queuedMessages: [{ id: "queued-1" }, { id: "queued-2" }],
    previousRunningTurnId: "",
    nextTurns: [
      {
        id: "turn-1",
        status: "running",
        startedAt: "2026-03-03T12:00:00.000Z",
      },
    ],
  });

  assert.equal(result.nextRunningTurnId, "turn-1");
  assert.deepEqual(result.nextQueuedMessages, [{ id: "queued-2" }]);
});

test("updateQueuedMessagesFromTurnSubscription keeps queued messages when running turn id is unchanged", () => {
  const result = updateQueuedMessagesFromTurnSubscription({
    queuedMessages: [{ id: "queued-1" }, { id: "queued-2" }],
    previousRunningTurnId: "turn-1",
    nextTurns: [
      {
        id: "turn-1",
        status: "running",
        startedAt: "2026-03-03T12:00:00.000Z",
      },
    ],
  });

  assert.equal(result.nextRunningTurnId, "turn-1");
  assert.deepEqual(result.nextQueuedMessages, [{ id: "queued-1" }, { id: "queued-2" }]);
});

test("updateQueuedMessagesFromTurnSubscription does not dequeue when no running turn exists", () => {
  const result = updateQueuedMessagesFromTurnSubscription({
    queuedMessages: [{ id: "queued-1" }],
    previousRunningTurnId: "turn-1",
    nextTurns: [
      {
        id: "turn-1",
        status: "completed",
        startedAt: "2026-03-03T12:00:00.000Z",
        endedAt: "2026-03-03T12:01:00.000Z",
      },
    ],
  });

  assert.equal(result.nextRunningTurnId, "");
  assert.deepEqual(result.nextQueuedMessages, [{ id: "queued-1" }]);
});
