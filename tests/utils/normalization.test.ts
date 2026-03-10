import test from "node:test";
import assert from "node:assert/strict";
import {
  getRunnerModelNames,
  getRunnerReasoningLevels,
  normalizeRunnerAvailableAgentSdks,
  normalizeRunnerCodexAvailableModels,
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
