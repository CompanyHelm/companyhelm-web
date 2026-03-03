import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTH_PROVIDER,
  COMPANYHELM_AUTH_TOKEN_STORAGE_KEY,
  DEFAULT_RUNNER_GRPC_TARGET,
  GRAPHQL_URL,
  GRAPHQL_WS_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_AUTH_TOKEN_STORAGE_KEY,
  SUPABASE_URL,
} from "../../src/utils/constants.js";

test("GraphQL constants default to the local API endpoint when vite env is unset", () => {
  assert.equal(GRAPHQL_URL, "http://127.0.0.1:4000/graphql");
  assert.equal(GRAPHQL_WS_URL, "ws://127.0.0.1:4000/graphql");
  assert.equal(DEFAULT_RUNNER_GRPC_TARGET, "localhost:50051");
  assert.equal(AUTH_PROVIDER, "companyhelm");
  assert.equal(COMPANYHELM_AUTH_TOKEN_STORAGE_KEY, "companyhelm.auth.token");
  assert.equal(SUPABASE_URL, "https://your-project-ref.supabase.co");
  assert.equal(SUPABASE_ANON_KEY, "your-supabase-anon-key");
  assert.equal(SUPABASE_AUTH_TOKEN_STORAGE_KEY, "supabase.auth.token");
});
