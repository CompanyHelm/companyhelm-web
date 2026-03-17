import test from "node:test";
import assert from "node:assert/strict";
import {
  toLegacyAgentPayload,
  toLegacyQueuedUserMessagePayload,
  toLegacyRunnerPayload,
  toLegacyTurnPayload,
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

test("toLegacyRunnerPayload preserves connection state and sdk auth metadata", () => {
  const payload = toLegacyRunnerPayload({
    id: "runner-1",
    name: "Runner One",
    isConnected: true,
    lastSeenAt: "2026-03-10T17:30:00.000Z",
    agentSdks: [
      {
        id: "sdk-1",
        name: "codex",
        status: "unconfigured",
        isAvailable: false,
        codexAuthStatus: "waiting_for_completion",
        codexAuthType: "device_code",
        errorMessage: "Waiting for login to finish.",
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
  assert.equal(payload.status, "");
  assert.equal(payload.availableAgentSdks?.[0]?.status, "unconfigured");
  assert.equal(payload.availableAgentSdks?.[0]?.codexAuthStatus, "waiting_for_completion");
  assert.equal(payload.availableAgentSdks?.[0]?.codexAuthType, "device_code");
  assert.equal(payload.availableAgentSdks?.[0]?.errorMessage, "Waiting for login to finish.");
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
    company: { id: "company-1" },
  });

  assert.equal(payload.lastSeenAt, null);
  assert.equal(payload.lastHealthCheckAt, null);
});

test("toLegacyRunnerPayload preserves missing runner names instead of falling back to runner ids", () => {
  const payload = toLegacyRunnerPayload({
    id: "runner-3",
    isConnected: false,
    company: { id: "company-1" },
  });

  assert.equal(payload.name, "");
});

test("toLegacyThreadPayload preserves missing titles instead of synthesizing thread ids", () => {
  const payload = toLegacyThreadPayload({
    id: "thread-3",
    company: { id: "company-1" },
    agent: { id: "agent-1" },
  });

  assert.equal(payload.title, "");
});

test("toLegacyThreadPayload maps token and context usage metadata", () => {
  const payload = toLegacyThreadPayload({
    id: "thread-4",
    title: "Token thread",
    company: { id: "company-1" },
    agent: { id: "agent-1" },
    tokenUsage: {
      inputTokens: 400,
      cachedInputTokens: 40,
      outputTokens: 140,
      reasoningOutputTokens: 20,
      totalTokens: 600,
    },
    contextUsage: {
      inputTokens: 250,
      cachedInputTokens: 25,
      outputTokens: 100,
      reasoningOutputTokens: 10,
      totalTokens: 385,
    },
    modelContextWindow: 200000,
  });

  assert.deepEqual(payload.tokenUsage, {
    inputTokens: 400,
    cachedInputTokens: 40,
    outputTokens: 140,
    reasoningOutputTokens: 20,
    totalTokens: 600,
  });
  assert.deepEqual(payload.contextUsage, {
    inputTokens: 250,
    cachedInputTokens: 25,
    outputTokens: 100,
    reasoningOutputTokens: 10,
    totalTokens: 385,
  });
  assert.equal(payload.modelContextWindow, 200000);
});

test("toLegacyTurnPayload maps per-turn token usage", () => {
  const payload = toLegacyTurnPayload({
    id: "turn-1",
    status: "completed",
    tokenUsage: {
      inputTokens: 120,
      cachedInputTokens: 15,
      outputTokens: 40,
      reasoningOutputTokens: 5,
      totalTokens: 180,
    },
    company: { id: "company-1" },
    thread: { id: "thread-1" },
    agent: { id: "agent-1" },
    items: [],
  });

  assert.deepEqual(payload.tokenUsage, {
    inputTokens: 120,
    cachedInputTokens: 15,
    outputTokens: 40,
    reasoningOutputTokens: 5,
    totalTokens: 180,
  });
});

test("toLegacyThreadPayload preserves unknown token usage as null", () => {
  const payload = toLegacyThreadPayload({
    id: "thread-null-usage",
    title: "Unknown usage",
    company: { id: "company-1" },
    agent: { id: "agent-1" },
    tokenUsage: {
      inputTokens: null,
      cachedInputTokens: null,
      outputTokens: null,
      reasoningOutputTokens: null,
      totalTokens: null,
    },
    contextUsage: {
      inputTokens: null,
      cachedInputTokens: null,
      outputTokens: null,
      reasoningOutputTokens: null,
      totalTokens: null,
    },
    modelContextWindow: null,
  });

  assert.deepEqual(payload.tokenUsage, {
    inputTokens: null,
    cachedInputTokens: null,
    outputTokens: null,
    reasoningOutputTokens: null,
    totalTokens: null,
  });
  assert.deepEqual(payload.contextUsage, {
    inputTokens: null,
    cachedInputTokens: null,
    outputTokens: null,
    reasoningOutputTokens: null,
    totalTokens: null,
  });
  assert.equal(payload.modelContextWindow, null);
});

test("toLegacyAgentPayload preserves heartbeat schedule metadata", () => {
  const payload = toLegacyAgentPayload({
    id: "agent-1",
    name: "Build Agent",
    status: "ready",
    heartbeats: [
      {
        id: "heartbeat-1",
        name: "Morning check-in",
        prompt: "Review open work and continue if needed.",
        enabled: true,
        intervalSeconds: 3600,
        nextHeartbeatAt: "2026-03-14T10:00:00.000Z",
        lastSentAt: "2026-03-14T09:00:00.000Z",
        thread: { id: "thread-1" },
      },
    ],
    company: { id: "company-1" },
    runner: { id: "runner-1" },
  });

  assert.equal(payload.heartbeats?.length, 1);
  assert.deepEqual(payload.heartbeats?.[0], {
    id: "heartbeat-1",
    name: "Morning check-in",
    prompt: "Review open work and continue if needed.",
    enabled: true,
    intervalSeconds: 3600,
    nextHeartbeatAt: "2026-03-14T10:00:00.000Z",
    lastSentAt: "2026-03-14T09:00:00.000Z",
    threadId: "thread-1",
  });
});
