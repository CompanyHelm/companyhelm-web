import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentChatsPage } from "../../src/pages/AgentChatsPage.tsx";

function renderAgentChatsPageMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(AgentChatsPage, {
      selectedCompanyId: "company-1",
      agent: {
        id: "agent-1",
        name: "Build Agent",
        model: "gpt-5",
        modelReasoningLevel: "medium",
        roleIds: [],
        skillIds: [],
        mcpServerIds: [],
        defaultAdditionalModelInstructions: "",
      },
      agents: [],
      chatSessions: [
        {
          id: "thread-1",
          title: "Thread 1",
          status: "archived",
          archivedAt: "2026-03-08T00:00:00.000Z",
          updatedAt: "2026-03-08T00:00:00.000Z",
        },
      ],
      chatSessionRunningById: {},
      isLoadingChatSessions: false,
      isCreatingChatSession: false,
      archivingChatSessionKey: "",
      deletingChatSessionKey: "",
      chatError: "",
      chatListStatusFilter: "active",
      createChatDisabledReason: "",
      chatSessionTitleDraft: "",
      chatSessionAdditionalModelInstructionsDraft: "",
      onChatSessionTitleDraftChange: () => {},
      onChatSessionAdditionalModelInstructionsDraftChange: () => {},
      onChatListStatusFilterChange: () => {},
      onCreateChatSession: async () => {},
      onOpenChat: () => {},
      onArchiveChat: () => {},
      onDeleteChat: () => {},
      onBackToAgents: () => {},
      onSetChatDraftMessage: () => {},
      agentRunners: [],
      roles: [],
      mcpServers: [],
      roleMcpServerIdsByRoleId: {},
      runnerCodexModelEntriesById: {},
      agentDrafts: {},
      savingAgentId: "",
      deletingAgentId: "",
      initializingAgentId: "",
      onAgentDraftChange: () => {},
      onSaveAgent: async () => true,
      onEnsureAgentEditorData: async () => {},
      ...overrides,
    }),
  );
}

test("AgentChatsPage hides create actions in archived mode", () => {
  const markup = renderAgentChatsPageMarkup({
    chatListStatusFilter: "archived",
  });

  assert.doesNotMatch(markup, />\s*New chat\s*</);
  assert.doesNotMatch(markup, /aria-label="Chat settings"/);
});

test("AgentChatsPage archived mode renders batch selection controls", () => {
  const markup = renderAgentChatsPageMarkup({
    chatListStatusFilter: "archived",
    onBatchDeleteChats: async () => ({ deletedKeys: [], failedKeys: [] }),
  });

  assert.match(markup, /aria-label="Select all archived chats"/);
  assert.match(markup, /aria-label="Select archived chat Thread 1"/);
  assert.match(markup, />\s*Deselect all\s*</);
  assert.match(markup, />\s*Delete selected\s*</);
});

test("AgentChatsPage shows create actions in active mode", () => {
  const markup = renderAgentChatsPageMarkup({
    chatListStatusFilter: "active",
  });

  assert.match(markup, />\s*New chat\s*</);
  assert.match(markup, /aria-label="Chat settings"/);
});

test("AgentChatsPage renders direct and inherited agent assignment sections separately", () => {
  const markup = renderAgentChatsPageMarkup({
    agent: {
      id: "agent-1",
      name: "Build Agent",
      model: "gpt-5",
      modelReasoningLevel: "medium",
      roleIds: ["role-1"],
      skillIds: ["skill-1"],
      mcpServerIds: ["mcp-1"],
      defaultAdditionalModelInstructions: "",
    },
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
  });

  assert.match(markup, />Direct Skills</);
  assert.match(markup, />Direct MCP Servers</);
  assert.match(markup, />Effective Skills</);
  assert.match(markup, />Effective MCP Servers</);
});
