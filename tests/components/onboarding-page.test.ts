import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FlagsPage } from "../../src/pages/FlagsPage.tsx";
import { OnboardingPage } from "../../src/pages/OnboardingPage.tsx";

function renderOnboardingPageMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(OnboardingPage, {
      isCreatingRunner: false,
      runnerNameDraft: "",
      runnerError: "",
      provisionedSecret: "",
      onboardingRunnerId: "",
      agentRunners: [],
      onboardingPhase: "agent",
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
      createdAgent: null,
      isCreatingPostCreateChat: false,
      onChatNow: () => {},
      onSkipPostCreate: () => {},
      onAdvanceToAgentPhase: () => {},
      codexAuthEvent: null,
      isStartingCodexAuth: false,
      onStartCodexDeviceAuth: () => {},
      ...overrides,
    }),
  );
}

test("OnboardingPage renders company, runner, configuring, and first-agent steps", () => {
  const markup = renderOnboardingPageMarkup();

  assert.match(markup, />Create company</);
  assert.match(markup, />Create agent runner</);
  assert.match(markup, />Configuring runner</);
  assert.match(markup, />Create first agent</);
  assert.doesNotMatch(markup, />Create first chat</);
  assert.doesNotMatch(markup, />Start your first chat</);
});

test("OnboardingPage still renders the onboarding agent form", () => {
  const markup = renderOnboardingPageMarkup();

  assert.match(markup, /id="onboarding-agent-name"/);
  assert.match(markup, /id="onboarding-agent-runner"/);
  assert.match(markup, /id="onboarding-agent-model"/);
});

test("OnboardingPage renders the post-create actions instead of the agent form after agent creation", () => {
  const markup = renderOnboardingPageMarkup({
    createdAgent: {
      id: "agent-1",
      name: "CEO Agent",
    },
  });

  assert.match(markup, />Agent created</);
  assert.match(markup, />CEO Agent</);
  assert.match(markup, />Chat now</);
  assert.match(markup, />Skip for now</);
  assert.doesNotMatch(markup, /id="onboarding-agent-name"/);
});

test("OnboardingPage renders a distinct configuring screen without the runner creation form", () => {
  const markup = renderOnboardingPageMarkup({
    onboardingPhase: "configuring",
    onboardingRunnerId: "runner-1",
    provisionedSecret: "runner-secret",
    agentRunners: [{ id: "runner-1", name: "Runner One", isConnected: false, availableAgentSdks: [] }],
  });

  assert.match(markup, />Configuring runner</);
  assert.doesNotMatch(markup, /id="onboarding-runner-name"/);
});

test("FlagsPage exposes the configuring onboarding phase option and not chat", () => {
  const markup = renderToStaticMarkup(
    React.createElement(FlagsPage, {
      flags: { skipOnboarding: false },
      onboardingPhase: "agent",
      onFlagChange: () => {},
      onResetOnboarding: () => {},
      onPhaseChange: () => {},
    }),
  );

  assert.doesNotMatch(markup, />chat</);
  assert.match(markup, />runner</);
  assert.match(markup, />configuring</);
  assert.match(markup, />agent</);
  assert.match(markup, />done</);
});
