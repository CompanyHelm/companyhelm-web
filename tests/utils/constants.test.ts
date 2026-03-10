import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTH_PROVIDER,
  COMPANYHELM_AUTH_TOKEN_STORAGE_KEY,
  DEFAULT_RUNNER_GRPC_TARGET,
  GRAPHQL_URL,
  GRAPHQL_WS_URL,
  MCP_AUTH_TYPE_OAUTH,
  MCP_AUTH_TYPE_OPTIONS,
  NAV_SECTIONS,
  PAGE_IDS,
  SUPABASE_ANON_KEY,
  SUPABASE_AUTH_TOKEN_STORAGE_KEY,
  SUPABASE_URL,
} from "../../src/utils/constants.ts";

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

test("visible navigation excludes hidden menu items while route ids still include them", () => {
  const visibleNavItemIds = NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.id));

  assert.equal(visibleNavItemIds.includes("secrets"), false);
  assert.equal(visibleNavItemIds.includes("approvals"), false);
  assert.equal(PAGE_IDS.has("secrets"), true);
  assert.equal(PAGE_IDS.has("approvals"), true);
});

test("MCP auth options include OAuth", () => {
  assert.equal(MCP_AUTH_TYPE_OAUTH, "oauth");
  assert.equal(MCP_AUTH_TYPE_OPTIONS.some((option) => option.value === "oauth"), true);
});
