import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentsPage } from "../../src/pages/AgentsPage.tsx";

function renderAgentsPageMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(AgentsPage, {
      selectedCompanyId: "company-1",
      agents: [
        {
          id: "agent-1",
          name: "Build Agent",
          agentRunnerId: "runner-1",
          roleIds: ["role-1"],
          skillIds: ["skill-1"],
          mcpServerIds: ["mcp-1"],
          agentSdk: "codex",
          model: "gpt-5",
          modelReasoningLevel: "medium",
          defaultAdditionalModelInstructions: "",
        },
      ],
      skills: [
        { id: "skill-1", name: "Brainstorming" },
        { id: "skill-2", name: "Systematic Debugging" },
      ],
      roles: [
        {
          id: "role-1",
          name: "Ops",
          effectiveSkills: [{ id: "skill-2", name: "Systematic Debugging" }],
        },
      ],
      mcpServers: [
        { id: "mcp-1", name: "Filesystem MCP" },
        { id: "mcp-2", name: "Context7" },
      ],
      roleMcpServerIdsByRoleId: {
        "role-1": ["mcp-2"],
      },
      agentRunners: [
        {
          id: "runner-1",
          name: "Runner One",
          isConnected: true,
          availableAgentSdks: [],
        },
      ],
      agentRunnerLookup: new Map([
        ["runner-1", { id: "runner-1", name: "Runner One", isConnected: true, availableAgentSdks: [] }],
      ]),
      runnerCodexModelEntriesById: new Map(),
      isLoadingAgents: false,
      agentError: "",
      isCreatingAgent: false,
      savingAgentId: null,
      deletingAgentId: null,
      initializingAgentId: null,
      hasLoadedAgentRunners: true,
      agentRunnerId: "runner-1",
      agentRoleIds: [],
      agentSkillIds: [],
      agentMcpServerIds: [],
      agentName: "",
      agentSdk: "codex",
      agentModel: "",
      agentModelReasoningLevel: "",
      agentDefaultAdditionalModelInstructions: "",
      agentDrafts: {},
      agentCountLabel: "1 agent",
      onAgentRunnerChange: () => {},
      onAgentRoleIdsChange: () => {},
      onAgentSkillIdsChange: () => {},
      onAgentMcpServerIdsChange: () => {},
      onAgentNameChange: () => {},
      onAgentSdkChange: () => {},
      onAgentModelChange: () => {},
      onAgentModelReasoningLevelChange: () => {},
      onAgentDefaultAdditionalModelInstructionsChange: () => {},
      onCreateAgent: async () => false,
      onAgentDraftChange: () => {},
      onEnsureAgentEditorData: async () => {},
      onSaveAgent: async () => false,
      onOpenAgentSessions: () => {},
      onCreateChatForAgent: async () => {},
      onDeleteAgent: async () => false,
      pendingEditAgentId: "",
      onClearPendingEditAgentId: () => {},
      ...overrides,
    }),
  );
}

test("AgentsPage agent cards include direct and inherited skill and MCP summaries", () => {
  const markup = renderAgentsPageMarkup();

  assert.match(markup, /Roles: Ops/);
  assert.match(markup, /Skills: Brainstorming, Systematic Debugging/);
  assert.match(markup, /MCP servers: Filesystem MCP, Context7/);
});
