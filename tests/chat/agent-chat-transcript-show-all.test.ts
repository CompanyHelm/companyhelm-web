import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentChatPage } from "../../src/pages/AgentChatPage.tsx";

function renderAgentChatPageMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(AgentChatPage, {
      selectedCompanyId: "company-1",
      agent: {
        id: "agent-1",
        name: "Build Agent",
        agentSdk: "codex",
        model: "gpt-5",
      },
      agents: [
        {
          id: "agent-1",
          name: "Build Agent",
          agentSdk: "codex",
          model: "gpt-5",
        },
      ],
      session: {
        id: "thread-1",
        title: "Thread 1",
        status: "ready",
      },
      chatSessionsByAgent: {
        "agent-1": [
          {
            id: "thread-1",
            title: "Thread 1",
            status: "ready",
          },
        ],
      },
      chatSessionRunningById: {},
      isLoadingChatIndex: false,
      isCreatingChatSession: false,
      showChatSidebar: false,
      chatSessionRenameDraft: "",
      chatTurns: [],
      queuedChatMessages: [],
      isLoadingChat: false,
      chatError: "",
      chatDraftMessage: "",
      isSendingChatMessage: false,
      isInterruptingChatTurn: false,
      isUpdatingChatTitle: false,
      deletingChatSessionKey: "",
      steeringQueuedMessageId: "",
      retryingQueuedMessageId: "",
      deletingQueuedMessageId: "",
      getCreateChatDisabledReason: () => "",
      onChatSessionRenameDraftChange: () => {},
      onChatDraftMessageChange: () => {},
      onBackToChats: () => {},
      onDeleteChat: async () => {},
      onSaveChatSessionTitle: async () => true,
      onSendChatMessage: () => {},
      onInterruptChatTurn: () => {},
      onSteerQueuedMessage: () => {},
      onRetryQueuedMessage: () => {},
      onDeleteQueuedMessage: () => {},
      onCreateChatForAgent: async () => {},
      onOpenChatFromList: () => {},
      ...overrides,
    }),
  );
}

test("AgentChatPage renders a show all toggle only for long transcript items", () => {
  const longTranscriptText = Array.from({ length: 31 }, () => "L").join("\n");
  const shortTranscriptText = Array.from({ length: 30 }, () => "S").join("\n");
  const markup = renderAgentChatPageMarkup({
    chatTurns: [
      {
        id: "turn-1",
        createdAt: "2026-03-08T12:00:00.000Z",
        status: "completed",
        items: [
          {
            id: "item-long",
            itemType: "agent_message",
            role: "assistant",
            text: longTranscriptText,
            createdAt: "2026-03-08T12:00:01.000Z",
          },
          {
            id: "item-short",
            itemType: "user_message",
            role: "human",
            text: shortTranscriptText,
            createdAt: "2026-03-08T12:00:02.000Z",
          },
        ],
      },
    ],
  });

  assert.match(markup, /Show all/);
  assert.equal((markup.match(/Show all/g) || []).length, 1);
  assert.equal((markup.match(/chat-message-content-clamped/g) || []).length, 1);
  assert.match(markup, /S\nS\nS/);
  assert.doesNotMatch(markup, /Show less/);
});

test("AgentChatPage renders the transcript toggle for long command items too", () => {
  const longCommandText = "C".repeat(2233);
  const markup = renderAgentChatPageMarkup({
    chatTurns: [
      {
        id: "turn-command",
        createdAt: "2026-03-08T13:00:00.000Z",
        status: "completed",
        items: [
          {
            id: "item-command",
            itemType: "command_execution",
            role: "assistant",
            command: longCommandText,
            createdAt: "2026-03-08T13:00:01.000Z",
          },
        ],
      },
    ],
  });

  assert.match(markup, /Show all/);
  assert.equal((markup.match(/chat-message-content-clamped/g) || []).length, 1);
  assert.match(markup, /command_execution/);
});
