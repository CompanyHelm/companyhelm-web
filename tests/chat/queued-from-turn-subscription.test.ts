import assert from "node:assert/strict";
import test from "node:test";
import { updateQueuedMessagesFromTurnSubscription } from "../../src/utils/chat.ts";

test("updateQueuedMessagesFromTurnSubscription drops the oldest queued message on new latest turn", () => {
  const result = updateQueuedMessagesFromTurnSubscription({
    queuedMessages: [{ id: "queued-1" }, { id: "queued-2" }],
    previousLatestTurnId: "",
    nextTurns: [
      {
        id: "turn-1",
        status: "running",
        startedAt: "2026-03-03T12:00:00.000Z",
      },
    ],
  });

  assert.equal(result.nextLatestTurnId, "turn-1");
  assert.deepEqual(result.nextQueuedMessages, [{ id: "queued-2" }]);
});

test("updateQueuedMessagesFromTurnSubscription keeps queued messages when latest turn id is unchanged", () => {
  const result = updateQueuedMessagesFromTurnSubscription({
    queuedMessages: [{ id: "queued-1" }, { id: "queued-2" }],
    previousLatestTurnId: "turn-1",
    nextTurns: [
      {
        id: "turn-1",
        status: "running",
        startedAt: "2026-03-03T12:00:00.000Z",
      },
    ],
  });

  assert.equal(result.nextLatestTurnId, "turn-1");
  assert.deepEqual(result.nextQueuedMessages, [{ id: "queued-1" }, { id: "queued-2" }]);
});

test("updateQueuedMessagesFromTurnSubscription does not dequeue when no running turn exists and latest turn is unchanged", () => {
  const result = updateQueuedMessagesFromTurnSubscription({
    queuedMessages: [{ id: "queued-1" }],
    previousLatestTurnId: "turn-1",
    nextTurns: [
      {
        id: "turn-1",
        status: "completed",
        startedAt: "2026-03-03T12:00:00.000Z",
        endedAt: "2026-03-03T12:01:00.000Z",
      },
    ],
  });

  assert.equal(result.nextLatestTurnId, "turn-1");
  assert.deepEqual(result.nextQueuedMessages, [{ id: "queued-1" }]);
});

test("updateQueuedMessagesFromTurnSubscription dequeues when latest turn changes even without a running turn", () => {
  const result = updateQueuedMessagesFromTurnSubscription({
    queuedMessages: [{ id: "queued-1" }],
    previousLatestTurnId: "turn-1",
    nextTurns: [
      {
        id: "turn-1",
        status: "completed",
        startedAt: "2026-03-03T12:00:00.000Z",
        endedAt: "2026-03-03T12:01:00.000Z",
      },
      {
        id: "turn-2",
        status: "completed",
        startedAt: "2026-03-03T12:02:00.000Z",
        endedAt: "2026-03-03T12:03:00.000Z",
      },
    ],
  });

  assert.equal(result.nextLatestTurnId, "turn-2");
  assert.deepEqual(result.nextQueuedMessages, []);
});
