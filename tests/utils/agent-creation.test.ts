import test from "node:test";
import assert from "node:assert/strict";
import { getAgentCreationFormStatus } from "../../src/utils/agent-creation.ts";

function createRunner(overrides: Record<string, unknown> = {}) {
  return {
    id: "runner-1",
    name: "Runner One",
    isConnected: true,
    availableAgentSdks: [
      {
        id: "sdk-1",
        name: "codex",
        status: "ready",
        isAvailable: true,
        availableModels: [
          {
            id: "model-1",
            name: "gpt-5",
            isAvailable: true,
            reasoningLevels: ["high", "medium"],
          },
        ],
      },
    ],
    ...overrides,
  };
}

test("getAgentCreationFormStatus returns ready when the selected runner and model selections are valid", () => {
  const formStatus = getAgentCreationFormStatus({
    agentRunners: [createRunner()],
    runnerCodexModelEntriesById: new Map([
      [
        "runner-1",
        [
          {
            id: "model-1",
            sdkId: "sdk-1",
            name: "gpt-5",
            reasoning: ["high", "medium"],
            isAvailable: true,
          },
        ],
      ],
    ]),
    agentName: "CEO Agent",
    agentRunnerId: "runner-1",
    agentSdk: "codex",
    agentModel: "gpt-5",
    agentModelReasoningLevel: "high",
  });

  assert.equal(formStatus.canSubmit, true);
  assert.equal(formStatus.selectedRunnerIsReady, true);
  assert.equal(formStatus.selectedSdkIsAvailable, true);
  assert.equal(formStatus.selectedModelIsAvailable, true);
  assert.equal(formStatus.selectedReasoningLevelIsAvailable, true);
});

test("getAgentCreationFormStatus blocks submission when the selected runner is offline even if another runner is ready", () => {
  const formStatus = getAgentCreationFormStatus({
    agentRunners: [
      createRunner({
        id: "runner-offline",
        isConnected: false,
        availableAgentSdks: [
          {
            id: "sdk-offline",
            name: "codex",
            status: "starting",
            isAvailable: true,
            availableModels: [
              {
                id: "model-offline",
                name: "gpt-5",
                isAvailable: true,
                reasoningLevels: ["high"],
              },
            ],
          },
        ],
      }),
      createRunner({
        id: "runner-ready",
      }),
    ],
    runnerCodexModelEntriesById: new Map([
      [
        "runner-offline",
        [
          {
            id: "model-offline",
            sdkId: "sdk-offline",
            name: "gpt-5",
            reasoning: ["high"],
            isAvailable: true,
          },
        ],
      ],
      [
        "runner-ready",
        [
          {
            id: "model-ready",
            sdkId: "sdk-1",
            name: "gpt-5",
            reasoning: ["high"],
            isAvailable: true,
          },
        ],
      ],
    ]),
    agentName: "CEO Agent",
    agentRunnerId: "runner-offline",
    agentSdk: "codex",
    agentModel: "gpt-5",
    agentModelReasoningLevel: "high",
  });

  assert.equal(formStatus.canSubmit, false);
  assert.equal(formStatus.selectedRunnerIsReady, false);
});

test("getAgentCreationFormStatus blocks submission when the selected sdk is unavailable on the selected runner", () => {
  const formStatus = getAgentCreationFormStatus({
    agentRunners: [
      createRunner({
        availableAgentSdks: [
          {
            id: "sdk-1",
            name: "codex",
            status: "error",
            isAvailable: false,
            availableModels: [],
          },
        ],
      }),
    ],
    runnerCodexModelEntriesById: new Map(),
    agentName: "CEO Agent",
    agentRunnerId: "runner-1",
    agentSdk: "codex",
    agentModel: "",
    agentModelReasoningLevel: "",
  });

  assert.equal(formStatus.canSubmit, false);
  assert.equal(formStatus.selectedSdkIsAvailable, false);
});

test("getAgentCreationFormStatus blocks submission when the selected model or reasoning is missing", () => {
  const missingModelStatus = getAgentCreationFormStatus({
    agentRunners: [createRunner()],
    runnerCodexModelEntriesById: new Map([
      [
        "runner-1",
        [
          {
            id: "model-1",
            sdkId: "sdk-1",
            name: "gpt-5",
            reasoning: ["high", "medium"],
            isAvailable: true,
          },
        ],
      ],
    ]),
    agentName: "CEO Agent",
    agentRunnerId: "runner-1",
    agentSdk: "codex",
    agentModel: "",
    agentModelReasoningLevel: "",
  });

  const missingReasoningStatus = getAgentCreationFormStatus({
    agentRunners: [createRunner()],
    runnerCodexModelEntriesById: new Map([
      [
        "runner-1",
        [
          {
            id: "model-1",
            sdkId: "sdk-1",
            name: "gpt-5",
            reasoning: ["high", "medium"],
            isAvailable: true,
          },
        ],
      ],
    ]),
    agentName: "CEO Agent",
    agentRunnerId: "runner-1",
    agentSdk: "codex",
    agentModel: "gpt-5",
    agentModelReasoningLevel: "",
  });

  assert.equal(missingModelStatus.canSubmit, false);
  assert.equal(missingModelStatus.selectedModelIsAvailable, false);
  assert.equal(missingReasoningStatus.canSubmit, false);
  assert.equal(missingReasoningStatus.selectedReasoningLevelIsAvailable, false);
});
