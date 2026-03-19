import assert from "node:assert/strict";
import test from "node:test";
import {
  ADD_CONVERSATION_AGENTS_MUTATION,
  CREATE_CONVERSATION_MUTATION,
  LIST_CONVERSATIONS_QUERY,
  LIST_CONVERSATION_MESSAGES_QUERY,
  SEND_CONVERSATION_MESSAGE_MUTATION,
} from "../../src/utils/graphql.ts";

test("conversation documents cover list, history, create, add-agents, and send operations", () => {
  assert.match(LIST_CONVERSATIONS_QUERY, /query ListConversations/);
  assert.match(LIST_CONVERSATIONS_QUERY, /conversations\(first: \$first, after: \$after\)/);
  assert.match(LIST_CONVERSATIONS_QUERY, /participants \{/);
  assert.match(LIST_CONVERSATIONS_QUERY, /latestMessagePreview/);

  assert.match(LIST_CONVERSATION_MESSAGES_QUERY, /query ListConversationMessages/);
  assert.match(LIST_CONVERSATION_MESSAGES_QUERY, /conversationMessages\(conversationId: \$conversationId, first: \$first, after: \$after\)/);
  assert.match(LIST_CONVERSATION_MESSAGES_QUERY, /senderActorInstanceId/);
  assert.match(LIST_CONVERSATION_MESSAGES_QUERY, /senderUserId/);

  assert.match(CREATE_CONVERSATION_MUTATION, /mutation CreateConversation/);
  assert.match(CREATE_CONVERSATION_MUTATION, /createConversation\(agentIds: \$agentIds\)/);

  assert.match(ADD_CONVERSATION_AGENTS_MUTATION, /mutation AddConversationAgents/);
  assert.match(ADD_CONVERSATION_AGENTS_MUTATION, /addConversationAgents\(conversationId: \$conversationId, agentIds: \$agentIds\)/);

  assert.match(SEND_CONVERSATION_MESSAGE_MUTATION, /mutation SendConversationMessage/);
  assert.match(SEND_CONVERSATION_MESSAGE_MUTATION, /sendConversationMessage\(conversationId: \$conversationId, text: \$text\)/);
  assert.match(SEND_CONVERSATION_MESSAGE_MUTATION, /text/);
});
