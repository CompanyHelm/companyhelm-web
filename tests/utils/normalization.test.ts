import test from "node:test";
import assert from "node:assert/strict";
import {
  getRunnerModelNames,
  getRunnerReasoningLevels,
  mergeAgentRunnerPayloadList,
  normalizeMcpAuthType,
  normalizeRunnerAvailableAgentSdks,
  normalizeRunnerCodexAvailableModels,
  replaceAgentRunnerPayloadList,
} from "../../src/utils/normalization.ts";

test("normalizeRunnerAvailableAgentSdks preserves sdk and model availability", () => {
  const sdkEntries = normalizeRunnerAvailableAgentSdks({
    availableAgentSdks: [
      {
        id: "sdk-1",
        name: "codex",
        isAvailable: false,
        availableModels: [
          {
            id: "model-1",
            name: "gpt-5",
            isAvailable: true,
            reasoningLevels: ["high", "medium"],
          },
          {
            id: "model-2",
            name: "gpt-4.1",
            is_available: false,
            reasoning: ["low"],
          },
        ],
      },
    ],
  });

  assert.equal(sdkEntries.length, 1);
  assert.equal(sdkEntries[0]?.isAvailable, false);
  assert.deepEqual(
    sdkEntries[0]?.availableModels.map((modelEntry) => ({
      name: modelEntry.name,
      isAvailable: modelEntry.isAvailable,
    })),
    [
      { name: "gpt-4.1", isAvailable: false },
      { name: "gpt-5", isAvailable: true },
    ],
  );
});

test("runner model helpers only expose available codex models", () => {
  const codexModels = normalizeRunnerCodexAvailableModels({
    availableAgentSdks: [
      {
        id: "sdk-1",
        name: "codex",
        isAvailable: true,
        availableModels: [
          {
            id: "model-1",
            name: "gpt-5",
            isAvailable: true,
            reasoningLevels: ["high", "medium"],
          },
          {
            id: "model-2",
            name: "gpt-4.1",
            isAvailable: false,
            reasoningLevels: ["low"],
          },
        ],
      },
    ],
  });

  assert.deepEqual(getRunnerModelNames(codexModels), ["gpt-5"]);
  assert.deepEqual(getRunnerReasoningLevels(codexModels, "gpt-5"), ["high", "medium"]);
  assert.deepEqual(getRunnerReasoningLevels(codexModels, "gpt-4.1"), []);
});

test("mergeAgentRunnerPayloadList preserves runners omitted from partial updates", () => {
  const mergedRunners = mergeAgentRunnerPayloadList(
    [
      { id: "runner-1", name: "Runner One", status: "ready", availableAgentSdks: [] },
      { id: "runner-2", name: "Runner Two", status: "ready", availableAgentSdks: [] },
    ],
    [
      { id: "runner-1", name: "Runner One Updated", status: "busy" },
    ],
  );

  assert.deepEqual(
    mergedRunners.map((runner) => ({
      id: runner.id,
      name: runner.name,
      status: runner.status,
    })),
    [
      { id: "runner-1", name: "Runner One Updated", status: "busy" },
      { id: "runner-2", name: "Runner Two", status: "ready" },
    ],
  );
});

test("replaceAgentRunnerPayloadList removes runners missing from full refresh payloads", () => {
  const refreshedRunners = replaceAgentRunnerPayloadList(
    [
      { id: "runner-1", name: "Runner One", status: "ready", availableAgentSdks: [] },
      { id: "runner-2", name: "Runner Two", status: "ready", availableAgentSdks: [] },
    ],
    [
      { id: "runner-1", name: "Runner One Updated", status: "busy" },
    ],
  );

  assert.deepEqual(
    refreshedRunners.map((runner) => ({
      id: runner.id,
      name: runner.name,
      status: runner.status,
    })),
    [
      { id: "runner-1", name: "Runner One Updated", status: "busy" },
    ],
  );
});

test("normalizeMcpAuthType accepts oauth aliases", () => {
  assert.equal(normalizeMcpAuthType("oauth"), "oauth");
  assert.equal(normalizeMcpAuthType("OAUTH"), "oauth");
});
