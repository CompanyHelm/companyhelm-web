import assert from "node:assert/strict";
import test from "node:test";
import { resolveGraphQLWebSocketUrl } from "../../src/utils/media.ts";

type TestWindow = Window & typeof globalThis;

test("resolveGraphQLWebSocketUrl converts absolute HTTP URLs to WebSocket URLs", () => {
  const result = resolveGraphQLWebSocketUrl("http://127.0.0.1:4000/graphql");
  assert.equal(result, "ws://127.0.0.1:4000/graphql");
});

test("resolveGraphQLWebSocketUrl preserves explicit WebSocket URLs", () => {
  const result = resolveGraphQLWebSocketUrl("wss://api.example.com/graphql");
  assert.equal(result, "wss://api.example.com/graphql");
});

test("resolveGraphQLWebSocketUrl resolves relative paths against the current origin", () => {
  const globalWithWindow = global as typeof global & { window?: TestWindow };
  const originalWindow = globalWithWindow.window;
  try {
    globalWithWindow.window = {
      location: new URL("http://localhost:5173/dashboard"),
    } as unknown as TestWindow;

    const result = resolveGraphQLWebSocketUrl("/graphql");
    assert.equal(result, "ws://localhost:5173/graphql");
  } finally {
    if (typeof originalWindow === "undefined") {
      Reflect.deleteProperty(globalWithWindow, "window");
    } else {
      globalWithWindow.window = originalWindow;
    }
  }
});
