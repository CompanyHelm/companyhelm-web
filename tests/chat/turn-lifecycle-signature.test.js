import assert from "node:assert/strict";
import test from "node:test";
import { getTurnLifecycleSignature } from "../../src/utils/chat.js";

test("getTurnLifecycleSignature returns empty string for missing turns", () => {
  assert.equal(getTurnLifecycleSignature(null), "");
  assert.equal(getTurnLifecycleSignature([]), "");
});

test("getTurnLifecycleSignature normalizes status and keeps lifecycle fields", () => {
  const signature = getTurnLifecycleSignature([
    {
      id: "turn-1",
      status: " RUNNING ",
      startedAt: "2026-03-03T12:00:00.000Z",
      endedAt: "",
      createdAt: "2026-03-03T12:00:00.000Z",
    },
  ]);

  assert.equal(signature, "turn-1:running:2026-03-03T12:00:00.000Z:");
});

test("getTurnLifecycleSignature is stable across equivalent turn ordering", () => {
  const first = getTurnLifecycleSignature([
    {
      id: "turn-2",
      status: "completed",
      startedAt: "2026-03-03T12:01:00.000Z",
      endedAt: "2026-03-03T12:02:00.000Z",
      createdAt: "2026-03-03T12:01:00.000Z",
    },
    {
      id: "turn-1",
      status: "running",
      startedAt: "2026-03-03T12:00:00.000Z",
      endedAt: "",
      createdAt: "2026-03-03T12:00:00.000Z",
    },
  ]);

  const second = getTurnLifecycleSignature([
    {
      id: "turn-1",
      status: "running",
      startedAt: "2026-03-03T12:00:00.000Z",
      endedAt: "",
      createdAt: "2026-03-03T12:00:00.000Z",
    },
    {
      id: "turn-2",
      status: "completed",
      startedAt: "2026-03-03T12:01:00.000Z",
      endedAt: "2026-03-03T12:02:00.000Z",
      createdAt: "2026-03-03T12:01:00.000Z",
    },
  ]);

  assert.equal(first, second);
});
