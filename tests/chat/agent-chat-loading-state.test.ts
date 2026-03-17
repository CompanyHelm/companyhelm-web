import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as AgentChatPageModule from "../../src/pages/AgentChatPage.tsx";

const { AgentChatPage } = AgentChatPageModule as Record<string, any>;

const CHAT_EMPTY_STATE_PROMPTS = [
  "Summarize this repository",
  "Find the most likely bug in this codebase",
  "Write an implementation plan for the next feature",
  "Explain how this project is structured",
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
      chatListStatusFilter: "active",
      getCreateChatDisabledReason: () => "",
      onChatSessionRenameDraftChange: () => {},
      onChatDraftMessageChange: () => {},
      onBackToChats: () => {},
      onArchiveChat: async () => {},
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

test("AgentChatPage shows loading copy while transcript data is unresolved", () => {
  const markup = renderAgentChatPageMarkup({
    isLoadingChat: true,
  });

  assert.match(markup, /Loading messages\.\.\./);
  assert.doesNotMatch(markup, /Loading chat messages\.\.\./);
  assert.doesNotMatch(markup, /No messages yet\. Start with one of these prompts\./);
});

test("AgentChatPage shows starter prompts after an empty transcript resolves", () => {
  const markup = renderAgentChatPageMarkup({
    isLoadingChat: false,
  });

  assert.match(markup, /No messages yet\. Start with one of these prompts\./);
  assert.doesNotMatch(markup, /Loading messages\.\.\./);
  for (const prompt of CHAT_EMPTY_STATE_PROMPTS) {
    assert.match(markup, new RegExp(escapeRegExp(prompt)));
  }
});

test("AgentChatPage shows explicit route not-found copy instead of starter prompts", () => {
  const markup = renderAgentChatPageMarkup({
    session: null,
    chatSessionsByAgent: {
      "agent-1": [],
    },
    routeNotFoundMessage: "Chat not found.",
    isLoadingChat: false,
  });

  assert.match(markup, /Chat not found\./);
  assert.doesNotMatch(markup, /No messages yet\. Start with one of these prompts\./);
});

test("AgentChatPage shows a create agent action when no agents exist", () => {
  const markup = renderAgentChatPageMarkup({
    agent: null,
    agents: [],
    session: null,
    chatSessionsByAgent: {},
    showChatSidebar: true,
    onOpenAgentsPage: () => {},
  });

  assert.match(markup, /No agents available yet\./);
  assert.match(markup, />Create new agent</);
});

test("AgentChatPage shows pending thread copy while the thread is still provisioning", () => {
  const markup = renderAgentChatPageMarkup({
    session: {
      id: "thread-pending",
      title: "Pending thread",
      status: "pending",
    },
    chatSessionsByAgent: {
      "agent-1": [
        {
          id: "thread-pending",
          title: "Pending thread",
          status: "pending",
        },
      ],
    },
  });

  assert.match(markup, /Thread is pending\. Messages sent now will queue until it is ready\./);
  assert.match(markup, /pending/);
});

test("AgentChatPage shows thread token and context summaries plus per-turn token usage", () => {
  const markup = renderAgentChatPageMarkup({
    session: {
      id: "thread-usage",
      title: "Usage thread",
      status: "ready",
      tokenUsage: {
        totalTokens: 900,
      },
      contextUsage: {
        totalTokens: 385,
        inputTokens: 250,
        cachedInputTokens: 25,
        outputTokens: 100,
        reasoningOutputTokens: 10,
      },
      modelContextWindow: 200000,
    },
    chatSessionsByAgent: {
      "agent-1": [
        {
          id: "thread-usage",
          title: "Usage thread",
          status: "ready",
          contextUsage: {
            totalTokens: 385,
            inputTokens: 250,
            cachedInputTokens: 25,
            outputTokens: 100,
            reasoningOutputTokens: 10,
          },
          modelContextWindow: 200000,
        },
      ],
    },
    chatTurns: [
      {
        id: "turn-1",
        status: "completed",
        tokenUsage: {
          totalTokens: 180,
        },
        createdAt: "2026-03-17T12:00:00.000Z",
        items: [
          {
            id: "item-1",
            itemType: "agent_message",
            role: "assistant",
            text: "Done.",
            createdAt: "2026-03-17T12:00:01.000Z",
          },
        ],
      },
    ],
  });

  assert.match(markup, /Tokens 900/);
  assert.match(markup, /Context 385 \/ 200000/);
  assert.match(markup, /Tokens 180/);
});

test("AgentChatPage shows archived chats as read-only and hides the composer", () => {
  const markup = renderAgentChatPageMarkup({
    session: {
      id: "thread-archived",
      title: "Archived thread",
      status: "archived",
      archivedAt: "2026-03-08T00:00:00.000Z",
    },
    chatSessionsByAgent: {
      "agent-1": [
        {
          id: "thread-archived",
          title: "Archived thread",
          status: "archived",
          archivedAt: "2026-03-08T00:00:00.000Z",
        },
      ],
    },
  });

  assert.match(markup, /Archived/);
  assert.match(markup, /Runtime resources were released\. This chat is preserved for reference only\./);
  assert.doesNotMatch(markup, /chat-composer-panel/);
  assert.doesNotMatch(markup, /Ask the agent to plan, debug, or implement something/);
});

test("AgentChatPage disables the composer when the runner is not ready and connected", () => {
  const markup = renderAgentChatPageMarkup({
    chatDraftMessage: "Ship it",
    sendDisabledReason: "Assigned runner runner-1 must be ready and connected before sending messages.",
  });

  assert.match(markup, /Assigned runner runner-1 must be ready and connected before sending messages\./);
  assert.match(markup, /Send message/);
  assert.match(markup, /disabled=""/);
});

test("AgentChatPage allows deleting submitted queued messages", () => {
  const markup = renderAgentChatPageMarkup({
    queuedChatMessages: [
      {
        id: "queued-1",
        status: "submitted",
        allowSteer: false,
        text: "runner logs should print full log",
        errorMessage: null,
        sdkTurnId: null,
      },
    ],
  });

  assert.match(markup, /Delete queued message/);
  assert.match(markup, /chat-queued-delete-btn/);
  assert.doesNotMatch(
    markup,
    /<button[^>]*class="chat-queued-delete-btn"[^>]*disabled=""[^>]*title="Delete queued message"/,
  );
});

test("applyChatPromptSuggestion updates the draft and focuses the composer", () => {
  const applyChatPromptSuggestion = (AgentChatPageModule as Record<string, any>).applyChatPromptSuggestion;

  assert.equal(typeof applyChatPromptSuggestion, "function");

  let nextDraftMessage = "";
  let focusCount = 0;
  applyChatPromptSuggestion({
    prompt: CHAT_EMPTY_STATE_PROMPTS[0],
    onChatDraftMessageChange: (value: string) => {
      nextDraftMessage = value;
    },
    inputRef: {
      current: {
        focus: () => {
          focusCount += 1;
        },
      },
    },
  });

  assert.equal(nextDraftMessage, CHAT_EMPTY_STATE_PROMPTS[0]);
  assert.equal(focusCount, 1);
});
