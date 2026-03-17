import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OnboardingGate } from "../../src/components/OnboardingGate.tsx";

function createBaseProps(overrides: Record<string, unknown> = {}) {
  return {
    selectedCompanyId: "company-1",
    skipOnboarding: false,
    hasLoadedAgentRunners: true,
    onboardingPhase: null,
    onboardingRunnerId: "",
    onboardingRunnerSecret: "",
    agentRunners: [],
    agents: [],
    isCreatingRunner: false,
    runnerNameDraft: "",
    runnerError: "",
    provisionedSecret: "",
    onRunnerNameChange: () => {},
    onCreateRunner: () => true,
    onSkip: () => {},
    isCreatingAgent: false,
    agentName: "",
    agentRunnerId: "",
    agentSdk: "codex",
    agentModel: "",
    agentModelReasoningLevel: "",
    agentError: "",
    runnerCodexModelEntriesById: new Map(),
    onAgentNameChange: () => {},
    onAgentRunnerChange: () => {},
    onAgentSdkChange: () => {},
    onAgentModelChange: () => {},
    onAgentModelReasoningLevelChange: () => {},
    onCreateAgent: async () => false,
    onAdvanceToAgentPhase: () => {},
    codexAuthEvent: null,
    isStartingCodexAuth: false,
    githubAppInstallUrl: "https://github.com/apps/companyhelm/installations/new?state=company-1",
    onStartCodexDeviceAuth: () => {},
    onSkipPostCreate: () => {},
    setOnboardingPhase: () => {},
    setOnboardingRunnerId: () => {},
    setOnboardingRunnerSecret: () => {},
    persistOnboarding: () => {},
    ...overrides,
  };
}

function renderOnboardingGateMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(OnboardingGate, createBaseProps(overrides)),
  );
}

test("OnboardingGate renders nothing when skip onboarding is enabled", () => {
  assert.equal(renderOnboardingGateMarkup({ skipOnboarding: true }), "");
});

test("OnboardingGate renders the runner onboarding screen when no runners exist", () => {
  const markup = renderOnboardingGateMarkup();

  assert.match(markup, />Create your agent runner</);
});

test("OnboardingGate renders the configuring screen when a runner exists but none are ready", () => {
  const markup = renderOnboardingGateMarkup({
    agentRunners: [{ id: "runner-1", name: "Runner One", isConnected: false, status: "starting", availableAgentSdks: [] }],
  });

  assert.match(markup, />Configuring runner</);
});

test("OnboardingGate renders the agent onboarding screen when a ready runner exists but no agents do", () => {
  const markup = renderOnboardingGateMarkup({
    agentRunners: [{
      id: "runner-1",
      name: "Runner One",
      isConnected: true,
      status: "ready",
      availableAgentSdks: [{ id: "sdk-1", name: "codex", status: "ready", isAvailable: true, availableModels: [] }],
    }],
  });

  assert.match(markup, />Create your first agent</);
});

test("OnboardingGate renders nothing when the company already has a ready runner and agent", () => {
  const markup = renderOnboardingGateMarkup({
    agentRunners: [{
      id: "runner-1",
      name: "Runner One",
      isConnected: true,
      status: "ready",
      availableAgentSdks: [{ id: "sdk-1", name: "codex", status: "ready", isAvailable: true, availableModels: [] }],
    }],
    agents: [{ id: "agent-1" }],
  });

  assert.equal(markup, "");
});

test("OnboardingGate preserves an explicit github phase even when the company already has a runner and agent", () => {
  const markup = renderOnboardingGateMarkup({
    onboardingPhase: "github",
    agentRunners: [{
      id: "runner-1",
      name: "Runner One",
      isConnected: true,
      status: "ready",
      availableAgentSdks: [{ id: "sdk-1", name: "codex", status: "ready", isAvailable: true, availableModels: [] }],
    }],
    agents: [{ id: "agent-1" }],
  });

  assert.match(markup, />Install GitHub App</);
  assert.match(markup, /href="https:\/\/github\.com\/apps\/companyhelm\/installations\/new\?state=company-1"/);
  assert.doesNotMatch(markup, />Chat now</);
});
