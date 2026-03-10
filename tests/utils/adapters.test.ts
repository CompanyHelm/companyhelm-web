import test from "node:test";
import assert from "node:assert/strict";
import {
  toLegacyQueuedUserMessagePayload,
  toLegacyRunnerPayload,
  toLegacyThreadPayload,
} from "../../src/utils/adapters.ts";

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

test("toLegacyThreadPayload preserves missing thread status", () => {
  const payload = toLegacyThreadPayload({
    id: "thread-2",
    company: { id: "company-1" },
    agent: { id: "agent-1" },
  });

  assert.equal(payload.status, "");
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

test("toLegacyRunnerPayload preserves connection and lifecycle status separately", () => {
  const payload = toLegacyRunnerPayload({
    id: "runner-1",
    name: "Runner One",
    isConnected: true,
    status: "ready",
    lastSeenAt: "2026-03-10T17:30:00.000Z",
    agentSdks: [
      {
        id: "sdk-1",
        name: "codex",
        isAvailable: false,
        models: [
          {
            id: "model-1",
            name: "gpt-5",
            isAvailable: false,
            reasoning: ["high"],
          },
        ],
      },
    ],
    company: { id: "company-1" },
  });

  assert.equal(payload.id, "runner-1");
  assert.equal(payload.isConnected, true);
  assert.equal(payload.status, "ready");
  assert.equal(payload.availableAgentSdks?.[0]?.isAvailable, false);
  assert.equal(payload.availableAgentSdks?.[0]?.availableModels?.[0]?.isAvailable, false);
  assert.equal(payload.lastSeenAt, "2026-03-10T17:30:00.000Z");
  assert.equal(payload.lastHealthCheckAt, "2026-03-10T17:30:00.000Z");
});

test("toLegacyRunnerPayload does not synthesize heartbeat timestamps", () => {
  const payload = toLegacyRunnerPayload({
    id: "runner-2",
    name: "Runner Two",
    isConnected: true,
    status: "ready",
    company: { id: "company-1" },
  });

  assert.equal(payload.lastSeenAt, null);
  assert.equal(payload.lastHealthCheckAt, null);
});
