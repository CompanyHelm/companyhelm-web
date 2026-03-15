import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentEditModal } from "../../src/components/AgentEditModal.tsx";

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
            reasoningLevels: ["high"],
          },
        ],
      },
    ],
    ...overrides,
  };
}

function renderAgentEditModalMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(AgentEditModal, {
      agents: [
        {
          id: "agent-1",
          name: "CEO Agent",
          agentRunnerId: "runner-1",
          roleIds: [],
          skillIds: [],
          mcpServerIds: [],
          agentSdk: "codex",
          model: "gpt-5",
          modelReasoningLevel: "high",
          defaultAdditionalModelInstructions: "",
        },
      ],
      agentRunners: [createRunner(), createRunner({ id: "runner-2", name: "Runner Two" })],
      roles: [],
      skills: [],
      mcpServers: [],
      roleMcpServerIdsByRoleId: {},
      runnerCodexModelEntriesById: new Map([
        ["runner-1", [{ id: "model-1", sdkId: "sdk-1", name: "gpt-5", reasoning: ["high"], isAvailable: true }]],
      ]),
      agentDrafts: {
        "agent-1": {
          agentRunnerId: "runner-1",
          roleIds: [],
          skillIds: [],
          mcpServerIds: [],
          name: "CEO Agent",
          agentSdk: "codex",
          model: "gpt-5",
          modelReasoningLevel: "high",
          defaultAdditionalModelInstructions: "",
        },
      },
      savingAgentId: null,
      deletingAgentId: null,
      initializingAgentId: null,
      onAgentDraftChange: () => {},
      onSaveAgent: async () => false,
      onEnsureAgentEditorData: async () => {},
      editingAgentId: "agent-1",
      onClose: () => {},
      ...overrides,
    }),
  );
}

test("AgentEditModal renders the selected runner summary with an edit toggle", () => {
  const markup = renderAgentEditModalMarkup({
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

  assert.match(markup, />Runner</);
  assert.match(markup, />Runner One</);
  assert.match(markup, /aria-label="Edit Runner"/);
  assert.doesNotMatch(markup, /runner-1 \(connected\)/);
});

test("AgentEditModal renders direct and effective skill and MCP summaries separately", () => {
  const markup = renderAgentEditModalMarkup({
    skills: [
      { id: "skill-1", name: "Brainstorming" },
      { id: "skill-2", name: "Systematic Debugging" },
    ],
    mcpServers: [
      { id: "mcp-1", name: "Filesystem MCP" },
      { id: "mcp-2", name: "Context7" },
    ],
    agents: [
      {
        id: "agent-1",
        name: "CEO Agent",
        agentRunnerId: "runner-1",
        roleIds: [],
        skillIds: ["skill-1"],
        mcpServerIds: ["mcp-1"],
        agentSdk: "codex",
        model: "gpt-5",
        modelReasoningLevel: "high",
        defaultAdditionalModelInstructions: "",
      },
    ],
    agentDrafts: {
      "agent-1": {
        agentRunnerId: "runner-1",
        roleIds: [],
        skillIds: ["skill-1"],
        mcpServerIds: ["mcp-1"],
        name: "CEO Agent",
        agentSdk: "codex",
        model: "gpt-5",
        modelReasoningLevel: "high",
        defaultAdditionalModelInstructions: "",
      },
    },
  });

  assert.match(markup, />Direct skills</);
  assert.match(markup, />Effective Skills</);
  assert.match(markup, />Brainstorming</);
  assert.match(markup, />Direct MCP Servers</);
  assert.match(markup, />Effective MCP Servers</);
  assert.match(markup, />Filesystem MCP</);
});
