import test from "node:test";
import assert from "node:assert/strict";
import { toLegacyQueuedUserMessagePayload, toLegacyThreadPayload } from "../../src/utils/adapters.ts";

test("toLegacyThreadPayload includes thread error status and message", () => {
  const payload = toLegacyThreadPayload({
    id: "thread-1",
    status: "error",
    errorMessage: "Failed to provision thread runtime container.",
    company: { id: "company-1" },
    agent: { id: "agent-1" },
  });

  assert.equal(payload.status, "error");
  assert.equal(payload.errorMessage, "Failed to provision thread runtime container.");
});

test("toLegacyQueuedUserMessagePayload maps failed status and error message", () => {
  const payload = toLegacyQueuedUserMessagePayload({
    id: "queued-1",
    status: "failed",
    errorMessage: "runner request failed",
    sdkTurnId: null,
    allowSteer: false,
    text: "retry me",
    company: { id: "company-1" },
    thread: { id: "thread-1" },
  });

  assert.equal(payload.status, "failed");
  assert.equal(payload.errorMessage, "runner request failed");
});

test("toLegacyQueuedUserMessagePayload defaults missing error message to null", () => {
  const payload = toLegacyQueuedUserMessagePayload({
    id: "queued-2",
    status: "queued",
    sdkTurnId: null,
    allowSteer: true,
    text: "pending",
    company: { id: "company-1" },
    thread: { id: "thread-1" },
  });

  assert.equal(payload.status, "queued");
  assert.equal(payload.errorMessage, null);
});
