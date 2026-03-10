import test from "node:test";
import assert from "node:assert/strict";
import {
  formatRunnerLabel,
  isRunnerReadyAndConnected,
  normalizeRunnerConnectionState,
} from "../../src/utils/formatting.ts";

test("normalizeRunnerConnectionState maps boolean connectivity", () => {
  assert.equal(normalizeRunnerConnectionState(true), "connected");
  assert.equal(normalizeRunnerConnectionState(false), "disconnected");
});

test("isRunnerReadyAndConnected requires both conditions", () => {
  assert.equal(isRunnerReadyAndConnected({ isConnected: true, status: "ready" }), true);
  assert.equal(isRunnerReadyAndConnected({ isConnected: true, status: "unconfigured" }), false);
  assert.equal(isRunnerReadyAndConnected({ isConnected: false, status: "ready" }), false);
});

test("formatRunnerLabel includes connection and status", () => {
  assert.equal(
    formatRunnerLabel({ id: "1234567890", isConnected: false, status: "unconfigured" }),
    "12345678 (disconnected, unconfigured)",
  );
});
