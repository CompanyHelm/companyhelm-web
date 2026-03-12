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
  assert.equal(isRunnerReadyAndConnected({
    isConnected: true,
    availableAgentSdks: [{ name: "codex", status: "ready", isAvailable: true, availableModels: [] }],
  }), true);
  assert.equal(isRunnerReadyAndConnected({
    isConnected: true,
    availableAgentSdks: [{ name: "codex", status: "unconfigured", isAvailable: true, availableModels: [] }],
  }), false);
  assert.equal(isRunnerReadyAndConnected({
    isConnected: false,
    availableAgentSdks: [{ name: "codex", status: "ready", isAvailable: true, availableModels: [] }],
  }), false);
});

test("formatRunnerLabel returns the runner name", () => {
  assert.equal(
    formatRunnerLabel({ id: "1234567890", name: "Runner One", isConnected: false }),
    "Runner One",
  );
});
