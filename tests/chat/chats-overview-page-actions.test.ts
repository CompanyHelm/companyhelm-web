import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatsOverviewPage } from "../../src/pages/ChatsOverviewPage.tsx";

function renderChatsOverviewPageMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(ChatsOverviewPage, {
      selectedCompanyId: "company-1",
      agents: [
        {
          id: "agent-1",
          name: "Build Agent",
          agentSdk: "codex",
          model: "gpt-5",
        },
      ],
      chatSessionsByAgent: {
        "agent-1": [
          {
            id: "thread-1",
            title: "Archived thread",
            status: "archived",
            archivedAt: "2026-03-08T00:00:00.000Z",
            updatedAt: "2026-03-08T00:00:00.000Z",
          },
        ],
      },
      chatSessionRunningById: {},
      isLoadingChatIndex: false,
      chatIndexError: "",
      isCreatingChatSession: false,
      deletingChatSessionKey: "",
      chatListStatusFilter: "active",
      onRefreshChatLists: () => {},
      onCreateChatForAgent: () => {},
      getCreateChatDisabledReason: () => "",
      onOpenChat: () => {},
      onDeleteChat: () => {},
      ...overrides,
    }),
  );
}

test("ChatsOverviewPage hides new chat cards in archived mode", () => {
  const markup = renderChatsOverviewPageMarkup({
    chatListStatusFilter: "archived",
  });

  assert.doesNotMatch(markup, />\s*New chat\s*</);
});

test("ChatsOverviewPage shows new chat cards in active mode", () => {
  const markup = renderChatsOverviewPageMarkup({
    chatListStatusFilter: "active",
    chatSessionsByAgent: {
      "agent-1": [
        {
          id: "thread-1",
          title: "Pending thread",
          status: "pending",
          updatedAt: "2026-03-08T00:00:00.000Z",
        },
        {
          id: "thread-2",
          title: "Errored thread",
          status: "error",
          errorMessage: "boom",
          updatedAt: "2026-03-08T00:00:00.000Z",
        },
      ],
    },
  });

  assert.match(markup, />\s*New chat\s*</);
  assert.match(markup, /Pending thread[\s\S]*chat-thread-status chat-thread-status-pending">pending</);
  assert.match(markup, /Errored thread[\s\S]*chat-thread-status chat-thread-status-error">error</);
});

test("ChatsOverviewPage archived list renders archived status after the chat title", () => {
  const markup = renderChatsOverviewPageMarkup({
    chatListStatusFilter: "archived",
  });

  assert.match(markup, /Archived thread[\s\S]*chat-thread-status chat-thread-status-archived">archived</);
});
