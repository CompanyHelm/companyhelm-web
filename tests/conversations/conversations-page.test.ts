import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConversationsPage } from "../../src/pages/ConversationsPage.tsx";

const conversationsPageSource = readFileSync(
  new URL("../../src/pages/ConversationsPage.tsx", import.meta.url),
  "utf8",
);

const appSource = readFileSync(
  new URL("../../src/App.tsx", import.meta.url),
  "utf8",
);

function renderConversationsPageMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(ConversationsPage, {
      currentUser: {
        id: "user-1",
        firstName: "Andrea",
        email: "andrea@example.com",
      },
      agents: [
        { id: "agent-1", name: "Planner Agent" },
        { id: "agent-2", name: "Research Agent" },
      ],
      conversations: [
        {
          id: "conversation-1",
          latestMessagePreview: "hello team",
          participants: [
            {
              id: "participant-user-1",
              actorInstanceId: "actor-instance-user-1",
              userId: "user-1",
              agentId: null,
              displayName: "Andrea",
            },
            {
              id: "participant-agent-1",
              actorInstanceId: "actor-instance-agent-1",
              userId: null,
              agentId: "agent-1",
              displayName: "Planner Agent",
            },
          ],
        },
      ],
      selectedConversationId: "conversation-1",
      messages: [
        {
          id: "message-1",
          senderActorInstanceId: "actor-instance-user-1",
          text: "hello team",
          createdAt: "2026-03-19T11:00:00.000Z",
        },
      ],
      isLoadingConversations: false,
      isLoadingMessages: false,
      isCreatingConversation: false,
      isAddingConversationAgents: false,
      isSendingConversationMessage: false,
      error: "",
      onOpenConversation: () => {},
      onCreateConversation: async () => {},
      onAddAgents: async () => {},
      onSendMessage: async () => {},
      ...overrides,
    }),
  );
}

test("ConversationsPage renders list, participants, transcript, and composer", () => {
  const markup = renderConversationsPageMarkup();

  assert.match(markup, />Conversations</);
  assert.match(markup, />Canonical multi-agent transcripts\./);
  assert.match(markup, />You, Planner Agent</);
  assert.match(markup, />hello team</);
  assert.match(markup, />Participants</);
  assert.match(markup, />You</);
  assert.match(markup, />Planner Agent</);
  assert.match(markup, />Add agents</);
  assert.match(markup, />Transcript</);
  assert.match(markup, />Newest-first canonical message history\./);
  assert.match(markup, />Send message</);
  assert.match(markup, /Write a message to the conversation\./);
  assert.match(markup, />Send message</);
});

test("ConversationsPage renders empty selection and loading states", () => {
  const emptyMarkup = renderConversationsPageMarkup({
    conversations: [],
    selectedConversationId: "",
    messages: [],
  });
  assert.match(emptyMarkup, /No conversations yet\./);
  assert.match(emptyMarkup, /Select a conversation/);

  const loadingMarkup = renderConversationsPageMarkup({
    isLoadingConversations: true,
    isLoadingMessages: true,
  });
  assert.match(loadingMarkup, /Loading conversations\.\.\./);
  assert.match(loadingMarkup, /Loading messages\.\.\./);
});

test("ConversationsPage source keeps creation, add-agents, and send actions on the dedicated page", () => {
  assert.match(conversationsPageSource, /<ConversationCreateModal/);
  assert.match(conversationsPageSource, /<ConversationParticipantsEditor/);
  assert.match(conversationsPageSource, /New conversation/);
  assert.match(conversationsPageSource, /onOpenConversation\(conversationId\)/);
  assert.match(conversationsPageSource, /await onCreateConversation\(agentIds\);/);
  assert.match(conversationsPageSource, /onSubmit={onAddAgents}/);
  assert.match(conversationsPageSource, /await onSendMessage\(messageDraft\);/);
});

test("App wires the conversations page to data loaders and mutations", () => {
  assert.match(appSource, /const shouldLoadConversationData = activePage === "conversations";/);
  assert.match(appSource, /const data = await executeGraphQL\(LIST_CONVERSATIONS_QUERY, \{\s*first: 100,\s*\}\);/);
  assert.match(appSource, /const data = await executeGraphQL\(LIST_CONVERSATION_MESSAGES_QUERY, \{/);
  assert.match(appSource, /await executeGraphQL\(CREATE_CONVERSATION_MUTATION, \{/);
  assert.match(appSource, /await executeGraphQL\(ADD_CONVERSATION_AGENTS_MUTATION, \{/);
  assert.match(appSource, /await executeGraphQL\(SEND_CONVERSATION_MESSAGE_MUTATION, \{/);
  assert.match(appSource, /<ConversationsPage/);
});
