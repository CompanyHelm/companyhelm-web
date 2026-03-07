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
