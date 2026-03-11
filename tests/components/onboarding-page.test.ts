import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FlagsPage } from "../../src/pages/FlagsPage.tsx";
import { OnboardingPage } from "../../src/pages/OnboardingPage.tsx";

function renderOnboardingPageMarkup() {
  return renderToStaticMarkup(
    React.createElement(OnboardingPage, {
      isCreatingRunner: false,
      runnerNameDraft: "",
      runnerError: "",
      provisionedSecret: "",
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
      onAdvanceToAgentPhase: () => {},
    }),
  );
}

test("OnboardingPage renders company, runner, and first-agent steps only", () => {
  const markup = renderOnboardingPageMarkup();

  assert.match(markup, />Create company</);
  assert.match(markup, />Create agent runner</);
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

test("FlagsPage no longer exposes a chat onboarding phase option", () => {
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
  assert.match(markup, />agent</);
  assert.match(markup, />done</);
});
