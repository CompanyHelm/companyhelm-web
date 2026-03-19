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
      githubAppInstallUrl: "https://github.com/apps/companyhelm/installations/new?state=company-1",
      onSkipPostCreate: () => {},
      onAdvanceToAgentPhase: () => {},
      codexAuthEvent: null,
      isStartingCodexAuth: false,
      onStartCodexDeviceAuth: () => {},
      ...overrides,
    }),
  );
}

test("OnboardingPage renders company, runner, configuring, first-agent, and github steps", () => {
  const markup = renderOnboardingPageMarkup();

  assert.match(markup, />Create company</);
  assert.match(markup, />Create agent runner</);
  assert.match(markup, />Configuring runner</);
  assert.match(markup, />Create first agent</);
  assert.match(markup, />Install GitHub App</);
});

test("OnboardingPage still renders the onboarding agent form", () => {
  const markup = renderOnboardingPageMarkup();

  assert.match(markup, /id="onboarding-agent-name"/);
  assert.match(markup, /id="onboarding-agent-runner"/);
  assert.match(markup, /id="onboarding-agent-model"/);
});

test("OnboardingPage renders the github terminal step instead of chat actions after agent creation", () => {
  const markup = renderOnboardingPageMarkup({
    onboardingPhase: "github",
  });

  assert.match(markup, />Install GitHub App</);
  assert.match(markup, />Skip for now</);
  assert.match(markup, /href="https:\/\/github\.com\/apps\/companyhelm\/installations\/new\?state=company-1"/);
  assert.doesNotMatch(markup, />Chat now</);
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

test("OnboardingPage shows runner names and disables runners that are not ready", () => {
  const markup = renderOnboardingPageMarkup({
    agentRunners: [
      {
        id: "runner-1",
        name: "Runner One",
        isConnected: true,
        availableAgentSdks: [
          { id: "sdk-1", name: "codex", status: "ready", isAvailable: true, availableModels: [] },
        ],
      },
      {
        id: "runner-2",
        name: "Runner Two",
        isConnected: false,
        availableAgentSdks: [
          { id: "sdk-2", name: "codex", status: "unconfigured", isAvailable: true, availableModels: [] },
        ],
      },
    ],
  });

  assert.match(markup, /<option value="runner-1">Runner One \(connected\)<\/option>/);
  assert.match(markup, /<option value="runner-2" disabled="">Runner Two \(offline\)<\/option>/);
  assert.doesNotMatch(markup, /runner-1"[^>]*>runner-1/);
});

test("OnboardingPage enables create agent when the selected model has no reasoning levels", () => {
  const markup = renderOnboardingPageMarkup({
    agentName: "CEO Agent",
    agentRunnerId: "runner-1",
    agentSdk: "codex",
    agentModel: "gpt-5",
    agentModelReasoningLevel: "",
    agentRunners: [
      {
        id: "runner-1",
        name: "Runner One",
        isConnected: true,
        availableAgentSdks: [
          {
            id: "sdk-1",
            name: "codex",
            status: "ready",
            isAvailable: true,
            availableModels: [
              {
                id: "model-1",
                name: "gpt-5",
                isAvailable: true,
                reasoningLevels: [],
              },
            ],
          },
        ],
      },
    ],
    runnerCodexModelEntriesById: new Map([
      [
        "runner-1",
        [
          {
            id: "model-1",
            sdkId: "sdk-1",
            name: "gpt-5",
            reasoning: [],
            isAvailable: true,
          },
        ],
      ],
    ]),
  });

  assert.match(markup, /<select id="onboarding-agent-reasoning"[^>]*>/);
  assert.doesNotMatch(markup, /<select id="onboarding-agent-reasoning"[^>]*required=""/);
  assert.match(markup, /<button type="submit">Create agent<\/button>/);
});

test("OnboardingPage enables create agent when all fields are set with reasoning levels", () => {
  const markup = renderOnboardingPageMarkup({
    agentName: "CEO Agent",
    agentRunnerId: "runner-1",
    agentSdk: "codex",
    agentModel: "gpt-5",
    agentModelReasoningLevel: "high",
    agentRunners: [
      {
        id: "runner-1",
        name: "Runner One",
        isConnected: true,
        availableAgentSdks: [
          {
            id: "sdk-1",
            name: "codex",
            status: "ready",
            isAvailable: true,
            availableModels: [
              {
                id: "model-1",
                name: "gpt-5",
                isAvailable: true,
                reasoningLevels: ["high", "medium"],
              },
            ],
          },
        ],
      },
    ],
    runnerCodexModelEntriesById: new Map([
      [
        "runner-1",
        [
          {
            id: "model-1",
            sdkId: "sdk-1",
            name: "gpt-5",
            reasoning: ["high", "medium"],
            isAvailable: true,
          },
        ],
      ],
    ]),
  });

  assert.match(markup, /<select id="onboarding-agent-reasoning"[^>]*required=""/);
  assert.match(markup, /<button type="submit">Create agent<\/button>/);
});

test("OnboardingPage disables create agent when reasoning level is not selected but model has reasoning levels", () => {
  const markup = renderOnboardingPageMarkup({
    agentName: "CEO Agent",
    agentRunnerId: "runner-1",
    agentSdk: "codex",
    agentModel: "gpt-5",
    agentModelReasoningLevel: "",
    agentRunners: [
      {
        id: "runner-1",
        name: "Runner One",
        isConnected: true,
        availableAgentSdks: [
          {
            id: "sdk-1",
            name: "codex",
            status: "ready",
            isAvailable: true,
            availableModels: [
              {
                id: "model-1",
                name: "gpt-5",
                isAvailable: true,
                reasoningLevels: ["high", "medium"],
              },
            ],
          },
        ],
      },
    ],
    runnerCodexModelEntriesById: new Map([
      [
        "runner-1",
        [
          {
            id: "model-1",
            sdkId: "sdk-1",
            name: "gpt-5",
            reasoning: ["high", "medium"],
            isAvailable: true,
          },
        ],
      ],
    ]),
  });

  assert.match(markup, /<button type="submit" disabled="">Create agent<\/button>/);
});

test("FlagsPage exposes the github onboarding phase option and debug flags", () => {
  const markup = renderToStaticMarkup(
    React.createElement(FlagsPage, {
      flags: { skipOnboarding: false, showChatContextUsage: false, showExternalAgents: false },
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
  assert.match(markup, />github</);
  assert.match(markup, />done</);
  assert.match(markup, /Show chat context usage/);
  assert.match(markup, /Show external agents/);
});
