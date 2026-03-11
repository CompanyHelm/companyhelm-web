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
  });

  assert.match(markup, />\s*New chat\s*</);
});
