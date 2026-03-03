import assert from "node:assert/strict";
import test from "node:test";
import { resolveGraphQLWebSocketUrl } from "../../src/utils/media.js";

test("resolveGraphQLWebSocketUrl converts absolute HTTP URLs to WebSocket URLs", () => {
  const result = resolveGraphQLWebSocketUrl("http://127.0.0.1:4000/graphql");
  assert.equal(result, "ws://127.0.0.1:4000/graphql");
});

test("resolveGraphQLWebSocketUrl preserves explicit WebSocket URLs", () => {
  const result = resolveGraphQLWebSocketUrl("wss://api.example.com/graphql");
  assert.equal(result, "wss://api.example.com/graphql");
});

test("resolveGraphQLWebSocketUrl resolves relative paths against the current origin", () => {
  const originalWindow = global.window;
  try {
    global.window = {
      location: new URL("http://localhost:5173/dashboard"),
    };

    const result = resolveGraphQLWebSocketUrl("/graphql");
    assert.equal(result, "ws://localhost:5173/graphql");
  } finally {
    if (typeof originalWindow === "undefined") {
      delete global.window;
    } else {
      global.window = originalWindow;
    }
  }
});
