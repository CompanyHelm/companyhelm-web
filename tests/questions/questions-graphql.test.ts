import assert from "node:assert/strict";
import test from "node:test";
import {
  ANSWER_AGENT_QUESTION_MUTATION,
  COMPANY_API_ANSWER_AGENT_QUESTION_MUTATION,
  COMPANY_API_LIST_AGENT_QUESTIONS_QUERY,
  LIST_AGENT_QUESTIONS_QUERY,
} from "../../src/utils/graphql.ts";

test("question GraphQL documents expose list and answer operations", () => {
  assert.match(LIST_AGENT_QUESTIONS_QUERY, /query ListAgentQuestions/);
  assert.match(LIST_AGENT_QUESTIONS_QUERY, /agentQuestions\(status: \$status, first: \$first\)/);
  assert.match(LIST_AGENT_QUESTIONS_QUERY, /questionText/);
  assert.match(LIST_AGENT_QUESTIONS_QUERY, /decisionType/);
  assert.match(LIST_AGENT_QUESTIONS_QUERY, /priority/);
  assert.match(LIST_AGENT_QUESTIONS_QUERY, /threadTitle/);
  assert.match(LIST_AGENT_QUESTIONS_QUERY, /options \{/);
  assert.match(LIST_AGENT_QUESTIONS_QUERY, /rating/);

  assert.match(ANSWER_AGENT_QUESTION_MUTATION, /mutation AnswerAgentQuestion/);
  assert.match(ANSWER_AGENT_QUESTION_MUTATION, /\$answerText: String/);
  assert.match(ANSWER_AGENT_QUESTION_MUTATION, /answerAgentQuestion\(id: \$id, answerText: \$answerText, status: \$status\)/);
  assert.match(ANSWER_AGENT_QUESTION_MUTATION, /ok/);
  assert.match(ANSWER_AGENT_QUESTION_MUTATION, /question \{/);

  assert.match(COMPANY_API_LIST_AGENT_QUESTIONS_QUERY, /query CompanyApiListAgentQuestions/);
  assert.match(COMPANY_API_ANSWER_AGENT_QUESTION_MUTATION, /mutation CompanyApiAnswerAgentQuestion/);
  assert.match(COMPANY_API_ANSWER_AGENT_QUESTION_MUTATION, /\$answerText: String/);
});
