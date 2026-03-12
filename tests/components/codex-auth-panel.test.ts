import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CodexAuthPanel } from "../../src/components/CodexAuthPanel.tsx";

function renderCodexAuthPanelMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(CodexAuthPanel, {
      sdk: {
        id: "sdk-1",
        name: "codex",
        status: "unconfigured",
        isAvailable: true,
        codexAuthStatus: "idle",
        codexAuthType: null,
        errorMessage: null,
        availableModels: [],
      },
      runnerId: "runner-1",
      authEvent: null,
      isRunnerConnected: true,
      isStarting: false,
      onStartDeviceCodeAuth: () => {},
      ...overrides,
    }),
  );
}

test("CodexAuthPanel shows an explicit retry action after device auth fails", () => {
  const markup = renderCodexAuthPanelMarkup({
    sdk: {
      id: "sdk-1",
      name: "codex",
      status: "error",
      isAvailable: true,
      codexAuthStatus: "failed",
      codexAuthType: "device_code",
      errorMessage: "Device auth failed.",
      availableModels: [],
    },
  });

  assert.match(markup, />failed</);
  assert.match(markup, />Retry device code auth</);
  assert.doesNotMatch(markup, />Start device code auth</);
});

test("CodexAuthPanel resets device auth UI when the runner disconnects", () => {
  const markup = renderCodexAuthPanelMarkup({
    sdk: {
      id: "sdk-1",
      name: "codex",
      status: "error",
      isAvailable: true,
      codexAuthStatus: "failed",
      codexAuthType: "device_code",
      errorMessage: "Previous auth failure.",
      availableModels: [],
    },
    authEvent: {
      runnerId: "runner-1",
      sdkId: "sdk-1",
      codexAuthStatus: "waiting_for_device_code",
      codexAuthType: "device_code",
      deviceCode: "ABCD-EFGH",
      errorMessage: null,
    },
    isRunnerConnected: false,
  });

  assert.match(markup, />disconnected</);
  assert.match(markup, /Start the runner first\./);
  assert.doesNotMatch(markup, /ABCD-EFGH/);
  assert.doesNotMatch(markup, /Login in OpenAI auth/);
  assert.doesNotMatch(markup, /Previous auth failure\./);
});
