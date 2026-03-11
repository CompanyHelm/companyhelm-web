import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENT_QUEUED_USER_MESSAGES_SUBSCRIPTION,
  CODEX_AUTH_EVENTS_SUBSCRIPTION,
  AGENT_RUNNERS_SUBSCRIPTION,
  AGENT_THREADS_SUBSCRIPTION,
  AGENT_TURNS_SUBSCRIPTION,
} from "../../src/utils/graphql.ts";

test("agent runners subscription omits company selection", () => {
  assert.doesNotMatch(AGENT_RUNNERS_SUBSCRIPTION, /company\s*\{/);
  assert.doesNotMatch(AGENT_RUNNERS_SUBSCRIPTION, /\n\s+status\s+\n\s+isConnected/);
  assert.match(AGENT_RUNNERS_SUBSCRIPTION, /agentSdks\s*\{\s*id\s*isAvailable\s*name\s*status\s*codexAuthStatus\s*codexAuthType\s*errorMessage/s);
});

test("agent threads subscription selects agent/model and omits company", () => {
  assert.doesNotMatch(AGENT_THREADS_SUBSCRIPTION, /company\s*\{/);
  assert.match(AGENT_THREADS_SUBSCRIPTION, /agent\s*\{\s*id\s*\}/);
  assert.match(AGENT_THREADS_SUBSCRIPTION, /currentModel\s*\{\s*id\s*name\s*\}/);
});

test("agent turns subscription selects thread and agent ids while omitting company", () => {
  assert.doesNotMatch(AGENT_TURNS_SUBSCRIPTION, /company\s*\{/);
  assert.match(AGENT_TURNS_SUBSCRIPTION, /thread\s*\{\s*id\s*\}/);
  assert.match(AGENT_TURNS_SUBSCRIPTION, /agent\s*\{\s*id\s*\}/);
  assert.match(AGENT_TURNS_SUBSCRIPTION, /turn\s*\{\s*id\s*thread\s*\{\s*id\s*\}\s*\}/);
});

test("queued user messages subscription keeps thread id and omits company", () => {
  assert.doesNotMatch(AGENT_QUEUED_USER_MESSAGES_SUBSCRIPTION, /company\s*\{/);
  assert.match(AGENT_QUEUED_USER_MESSAGES_SUBSCRIPTION, /thread\s*\{\s*id\s*\}/);
});

test("codex auth events subscription requests transient device code fields", () => {
  assert.doesNotMatch(CODEX_AUTH_EVENTS_SUBSCRIPTION, /company\s*\{/);
  assert.match(CODEX_AUTH_EVENTS_SUBSCRIPTION, /runnerSdkCodexAuthUpdated\s*\(/);
  assert.match(CODEX_AUTH_EVENTS_SUBSCRIPTION, /runnerId/);
  assert.match(CODEX_AUTH_EVENTS_SUBSCRIPTION, /sdkId/);
  assert.match(CODEX_AUTH_EVENTS_SUBSCRIPTION, /codexAuthStatus/);
  assert.match(CODEX_AUTH_EVENTS_SUBSCRIPTION, /codexAuthType/);
  assert.match(CODEX_AUTH_EVENTS_SUBSCRIPTION, /deviceCode/);
  assert.match(CODEX_AUTH_EVENTS_SUBSCRIPTION, /errorMessage/);
});
