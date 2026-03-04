import assert from "node:assert/strict";
import test from "node:test";
import { isChatSessionRunning } from "../../src/utils/chat.ts";

test("isChatSessionRunning returns true for running status", () => {
  const result = isChatSessionRunning(
    {
      id: "thread-1",
      status: "running",
    },
    {},
  );

  assert.equal(result, true);
});

test("isChatSessionRunning returns false for ready status with no local running override", () => {
  const result = isChatSessionRunning(
    {
      id: "thread-1",
      status: "ready",
    },
    {},
  );

  assert.equal(result, false);
});

test("isChatSessionRunning honors local running override even when session status is ready", () => {
  const result = isChatSessionRunning(
    {
      id: "thread-1",
      status: "ready",
    },
    {
      "thread-1": true,
    },
  );

  assert.equal(result, true);
});
