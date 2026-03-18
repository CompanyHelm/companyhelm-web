import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENT_THREADS_SUBSCRIPTION,
  AGENT_TURNS_SUBSCRIPTION,
  COMPANY_API_LIST_AGENTS_WITH_THREADS_CONNECTION_QUERY,
  COMPANY_API_LIST_THREADS_CONNECTION_QUERY,
  COMPANY_API_LIST_THREAD_TURNS_CONNECTION_QUERY,
  COMPANY_API_THREAD_QUERY,
} from "../../src/utils/graphql.ts";

test("thread list and lookup documents request thread token usage metadata", () => {
  for (const document of [
    COMPANY_API_LIST_AGENTS_WITH_THREADS_CONNECTION_QUERY,
    COMPANY_API_LIST_THREADS_CONNECTION_QUERY,
    COMPANY_API_THREAD_QUERY,
    AGENT_THREADS_SUBSCRIPTION,
  ]) {
    assert.match(document, /tokenUsage\s*\{\s*inputTokens\s*cachedInputTokens\s*outputTokens\s*reasoningOutputTokens\s*totalTokens\s*\}/s);
    assert.match(document, /contextUsage\s*\{\s*inputTokens\s*cachedInputTokens\s*outputTokens\s*reasoningOutputTokens\s*totalTokens\s*\}/s);
    assert.match(document, /modelContextWindow/);
  }
});

test("thread turn documents request per-turn token usage metadata", () => {
  for (const document of [
    COMPANY_API_LIST_THREAD_TURNS_CONNECTION_QUERY,
    AGENT_TURNS_SUBSCRIPTION,
  ]) {
    assert.match(document, /tokenUsage\s*\{\s*inputTokens\s*cachedInputTokens\s*outputTokens\s*reasoningOutputTokens\s*totalTokens\s*\}/s);
  }
});
