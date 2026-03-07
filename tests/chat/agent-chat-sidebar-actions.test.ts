import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as AgentChatPageModule from "../../src/pages/AgentChatPage.tsx";

const { AgentChatPage } = AgentChatPageModule as Record<string, any>;

type GlobalWithWindow = typeof global & {
  window?: Window & typeof globalThis;
};

const testGlobal = global as GlobalWithWindow;

function createMockStorage(storageMap: Map<string, string>): Storage {
  return {
    get length() {
      return storageMap.size;
    },
    clear() {
      storageMap.clear();
    },
    key(index: number) {
      return Array.from(storageMap.keys())[index] ?? null;
    },
    getItem(key: string) {
      return storageMap.has(key) ? storageMap.get(key) || null : null;
    },
    setItem(key: string, value: string) {
      storageMap.set(key, String(value));
    },
    removeItem(key: string) {
      storageMap.delete(key);
    },
  };
}

function renderAgentChatPageMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(AgentChatPage, {
      selectedCompanyId: "company-1",
      agent: null,
      agents: [
        {
          id: "agent-1",
          name: "Build Agent",
          agentSdk: "codex",
          model: "gpt-5",
        },
      ],
      session: null,
      chatSessionsByAgent: {
        "agent-1": [
          {
            id: "thread-1",
            title: "Thread 1",
            status: "ready",
          },
          {
            id: "thread-2",
            title: "Thread 2",
            status: "error",
          },
        ],
      },
      chatSessionRunningById: {},
      isLoadingChatIndex: false,
      isCreatingChatSession: false,
      showChatSidebar: true,
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

test("AgentChatPage mobile sidebar renders delete actions for each chat session", () => {
  const originalWindow = testGlobal.window;
  const localStorageMap = new Map<string, string>();

  try {
    testGlobal.window = {
      localStorage: createMockStorage(localStorageMap),
      matchMedia: () => ({ matches: true }),
    } as unknown as Window & typeof globalThis;

    const markup = renderAgentChatPageMarkup();
    const deleteLabels = markup.match(/aria-label="Delete chat"/g) || [];

    assert.equal(deleteLabels.length, 2);
    assert.match(markup, /Thread 1/);
    assert.match(markup, /Thread 2/);
  } finally {
    if (typeof originalWindow === "undefined") {
      Reflect.deleteProperty(testGlobal, "window");
    } else {
      testGlobal.window = originalWindow;
    }
  }
});
