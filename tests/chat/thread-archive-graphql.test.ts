import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENT_THREADS_SUBSCRIPTION,
  COMPANY_API_ARCHIVE_THREAD_MUTATION,
  COMPANY_API_LIST_AGENTS_WITH_THREADS_CONNECTION_QUERY,
  COMPANY_API_LIST_THREADS_CONNECTION_QUERY,
  COMPANY_API_THREAD_QUERY,
} from "../../src/utils/graphql.ts";

test("thread list GraphQL documents support archived status filtering", () => {
  assert.match(COMPANY_API_LIST_THREADS_CONNECTION_QUERY, /\$status:\s*ThreadStatus/);
  assert.match(
    COMPANY_API_LIST_THREADS_CONNECTION_QUERY,
    /threads\(agentId: \$agentId, first: \$first, after: \$after, status: \$status\)/,
  );
  assert.match(COMPANY_API_LIST_AGENTS_WITH_THREADS_CONNECTION_QUERY, /\$threadStatus:\s*ThreadStatus/);
  assert.match(
    COMPANY_API_LIST_AGENTS_WITH_THREADS_CONNECTION_QUERY,
    /threads\(first: \$firstThreads, status: \$threadStatus\)/,
  );
  assert.match(AGENT_THREADS_SUBSCRIPTION, /\$status:\s*ThreadStatus/);
  assert.match(
    AGENT_THREADS_SUBSCRIPTION,
    /agentThreadsUpdated\(agentId: \$agentId, first: \$first, status: \$status\)/,
  );
});

test("thread archive GraphQL documents expose archive and direct thread lookup", () => {
  assert.match(COMPANY_API_ARCHIVE_THREAD_MUTATION, /archiveThread\(threadId: \$threadId\)/);
  assert.match(COMPANY_API_THREAD_QUERY, /thread\(id: \$threadId\)/);
  assert.match(COMPANY_API_THREAD_QUERY, /archivedAt/);
});
