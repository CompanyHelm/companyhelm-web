import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentCreateModal } from "../../src/components/AgentCreateModal.tsx";

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

function renderAgentCreateModalMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(AgentCreateModal, {
      isOpen: true,
      hasLoadedAgentRunners: true,
      formStatus: {
        canSubmit: true,
      },
      agentRunners: [createRunner()],
      createAssignedRoleIds: [],
      createAvailableRoles: [],
      createEffectiveMcpServerLabels: [],
      roleLabelById: new Map(),
      agentRunnerId: "runner-1",
      agentName: "CEO Agent",
      agentSdk: "codex",
      agentModel: "gpt-5",
      agentModelReasoningLevel: "high",
      agentDefaultAdditionalModelInstructions: "",
      sdkAvailabilityByName: new Map([["codex", "available"]]),
      runnerModelEntries: [
        {
          id: "model-1",
          sdkId: "sdk-1",
          name: "gpt-5",
          reasoning: ["high", "medium"],
          isAvailable: true,
        },
      ],
      runnerModelNames: ["gpt-5"],
      runnerReasoningLevels: ["high", "medium"],
      isCreatingAgent: false,
      createdAgent: null,
      isCreatingPostCreateChat: false,
      onClose: () => {},
      onCreateAgent: async () => false,
      onAgentRunnerChange: () => {},
      onAgentRoleIdsChange: () => {},
      onAgentNameChange: () => {},
      onAgentSdkChange: () => {},
      onAgentModelChange: () => {},
      onAgentModelReasoningLevelChange: () => {},
      onAgentDefaultAdditionalModelInstructionsChange: () => {},
      onChatNow: () => {},
      onSkipPostCreate: () => {},
      ...overrides,
    }),
  );
}

test("AgentCreateModal renders the create agent form when no agent has been created yet", () => {
  const markup = renderAgentCreateModalMarkup();

  assert.match(markup, /id="agent-name"/);
  assert.match(markup, />Create agent</);
  assert.doesNotMatch(markup, />Agent created</);
});

test("AgentCreateModal renders the shared post-create actions after agent creation", () => {
  const markup = renderAgentCreateModalMarkup({
    createdAgent: {
      id: "agent-1",
      name: "CEO Agent",
    },
  });

  assert.match(markup, />Agent created</);
  assert.match(markup, />Chat now</);
  assert.match(markup, />Skip for now</);
  assert.doesNotMatch(markup, /id="agent-name"/);
});

test("AgentCreateModal shows runner names and disables runners that are not ready", () => {
  const markup = renderAgentCreateModalMarkup({
    agentRunnerId: "",
    agentRunners: [
      createRunner(),
      createRunner({
        id: "runner-2",
        name: "Runner Two",
        isConnected: false,
        availableAgentSdks: [
          {
            id: "sdk-2",
            name: "codex",
            status: "unconfigured",
            isAvailable: true,
            availableModels: [],
          },
        ],
      }),
    ],
  });

  assert.match(markup, /<option value="runner-1">Runner One<\/option>/);
  assert.match(markup, /<option value="runner-2" disabled="">Runner Two<\/option>/);
  assert.doesNotMatch(markup, /runner-1 \(connected\)/);
});
