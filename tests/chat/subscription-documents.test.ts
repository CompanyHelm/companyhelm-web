import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENT_QUEUED_USER_MESSAGES_SUBSCRIPTION,
  AGENT_RUNNERS_SUBSCRIPTION,
  AGENT_THREADS_SUBSCRIPTION,
  AGENT_TURNS_SUBSCRIPTION,
} from "../../src/utils/graphql.ts";

test("agent runners subscription selects nested company id", () => {
  assert.match(AGENT_RUNNERS_SUBSCRIPTION, /company\s*\{\s*id\s*\}/);
});

test("agent threads subscription selects nested ids and model object", () => {
  assert.match(AGENT_THREADS_SUBSCRIPTION, /company\s*\{\s*id\s*\}/);
  assert.match(AGENT_THREADS_SUBSCRIPTION, /agent\s*\{\s*id\s*\}/);
  assert.match(AGENT_THREADS_SUBSCRIPTION, /currentModel\s*\{\s*id\s*name\s*\}/);
});

test("agent turns subscription selects nested turn and item identifiers", () => {
  assert.match(AGENT_TURNS_SUBSCRIPTION, /company\s*\{\s*id\s*\}/);
  assert.match(AGENT_TURNS_SUBSCRIPTION, /thread\s*\{\s*id\s*\}/);
  assert.match(AGENT_TURNS_SUBSCRIPTION, /agent\s*\{\s*id\s*\}/);
  assert.match(AGENT_TURNS_SUBSCRIPTION, /turn\s*\{\s*id\s*thread\s*\{\s*id\s*\}\s*\}/);
});

test("queued user messages subscription selects nested company and thread ids", () => {
  assert.match(AGENT_QUEUED_USER_MESSAGES_SUBSCRIPTION, /company\s*\{\s*id\s*\}/);
  assert.match(AGENT_QUEUED_USER_MESSAGES_SUBSCRIPTION, /thread\s*\{\s*id\s*\}/);
});
