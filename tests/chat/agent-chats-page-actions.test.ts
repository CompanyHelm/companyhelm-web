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
      activeTab: "overview",
      onSelectTab: () => {},
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
    activeTab: "chats",
    chatListStatusFilter: "archived",
  });

  assert.doesNotMatch(markup, />\s*New chat\s*</);
  assert.doesNotMatch(markup, /aria-label="Chat settings"/);
});

test("AgentChatsPage archived mode renders batch selection controls", () => {
  const markup = renderAgentChatsPageMarkup({
    activeTab: "chats",
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
    activeTab: "chats",
    chatListStatusFilter: "active",
  });

  assert.match(markup, />\s*New chat\s*</);
  assert.match(markup, /aria-label="Chat settings"/);
});

test("AgentChatsPage overview renders inline editor and assignment sections", () => {
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

  assert.match(markup, />Direct skills</);
  assert.match(markup, />Direct MCP Servers</);
  assert.match(markup, />Effective Skills</);
  assert.match(markup, />Effective MCP Servers</);
  assert.match(markup, />Configuration</);
  assert.match(markup, />Agent API</);
  assert.match(markup, />Swagger docs</);
  assert.match(markup, /Used by agents to operate on CompanyHelm resources\./);
  assert.match(markup, /href="[^"]*\/agent\/v1\/docs"/);
  assert.match(markup, />Open Swagger UI</);
  assert.doesNotMatch(markup, /<p class="role-detail-stat-label">Roles<\/p>/);
  assert.match(markup, />Save agent</);
  assert.doesNotMatch(markup, /Back to agents/);
});

test("AgentChatsPage heartbeats tab renders heartbeat controls and schedule state", () => {
  const markup = renderAgentChatsPageMarkup({
    activeTab: "heartbeats",
    agent: {
      id: "agent-1",
      name: "Build Agent",
      model: "gpt-5",
      modelReasoningLevel: "medium",
      roleIds: [],
      skillIds: [],
      mcpServerIds: [],
      defaultAdditionalModelInstructions: "",
      heartbeats: [
        {
          id: "heartbeat-1",
          name: "Morning check-in",
          prompt: "Review open work and continue if needed.",
          enabled: true,
          intervalSeconds: 3600,
          nextHeartbeatAt: "2026-03-14T10:00:00.000Z",
          lastSentAt: "2026-03-14T09:00:00.000Z",
          threadId: "thread-1",
        },
      ],
    },
  });

  assert.match(markup, />Heartbeat schedules</);
  assert.match(markup, /Interval \(min\)/);
  assert.match(markup, /Morning check-in/);
  assert.match(markup, /Review open work and continue if needed\./);
  assert.match(markup, /Next scheduled/);
  assert.match(markup, /Last sent/);
  assert.match(markup, />\s*Schedule now\s*</);
  assert.match(markup, />\s*Open thread\s*</);
  assert.match(markup, /aria-label="Edit Name"/);
  assert.match(markup, /aria-label="Edit Prompt"/);
  assert.match(markup, /aria-label="Edit Interval"/);
  assert.match(markup, /aria-label="Disable heartbeat"/);
  assert.doesNotMatch(markup, />\s*Save heartbeat\s*</);
});

test("AgentChatsPage shows schedule now for paused heartbeats", () => {
  const markup = renderAgentChatsPageMarkup({
    activeTab: "heartbeats",
    agent: {
      id: "agent-1",
      name: "Build Agent",
      model: "gpt-5",
      modelReasoningLevel: "medium",
      roleIds: [],
      skillIds: [],
      mcpServerIds: [],
      defaultAdditionalModelInstructions: "",
      heartbeats: [
        {
          id: "heartbeat-1",
          name: "Morning check-in",
          prompt: "Review open work and continue if needed.",
          enabled: false,
          intervalSeconds: 3600,
          nextHeartbeatAt: "2026-03-14T10:00:00.000Z",
          lastSentAt: "2026-03-14T09:00:00.000Z",
          threadId: null,
        },
      ],
    },
  });

  assert.match(markup, />\s*Schedule now\s*</);
  assert.match(markup, /aria-label="Enable heartbeat"/);
  assert.match(markup, /No linked thread yet/);
});

test("AgentChatsPage renders empty heartbeat state when none exist", () => {
  const markup = renderAgentChatsPageMarkup({
    activeTab: "heartbeats",
  });

  assert.match(markup, />Heartbeat schedules</);
  assert.match(markup, /No heartbeat schedules configured/);
});

test("AgentChatsPage renders tab buttons with the active tab selected", () => {
  const markup = renderAgentChatsPageMarkup({
    activeTab: "overview",
  });

  assert.match(markup, /role="tab"/);
  assert.match(markup, /aria-selected="true"[^>]*>Overview</);
  assert.match(markup, />Chats</);
  assert.match(markup, />Heartbeats</);
});
