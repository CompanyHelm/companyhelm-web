import assert from "node:assert/strict";
import test from "node:test";
import { GRAPHQL_URL, GRAPHQL_WS_URL } from "../../src/utils/constants.js";

test("GraphQL constants default to the local API endpoint when vite env is unset", () => {
  assert.equal(GRAPHQL_URL, "http://127.0.0.1:4000/graphql");
  assert.equal(GRAPHQL_WS_URL, "ws://127.0.0.1:4000/graphql");
});
