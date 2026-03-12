import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveEffectiveOnboardingPhase,
  getPostAgentCreationOnboardingRedirectPath,
  reconcileOnboardingPhase,
} from "../../src/utils/onboarding.ts";

test("reconcileOnboardingPhase clears a stale agent phase when the company already has agents", () => {
  assert.equal(
    reconcileOnboardingPhase({
      phase: "agent",
      runnerCount: 1,
      readyRunnerCount: 1,
      agentCount: 2,
    }),
    null,
  );
});

test("reconcileOnboardingPhase keeps the agent phase when the company has no agents yet", () => {
  assert.equal(
    reconcileOnboardingPhase({
      phase: "agent",
      runnerCount: 1,
      readyRunnerCount: 1,
      agentCount: 0,
    }),
    "agent",
  );
});

test("reconcileOnboardingPhase advances a stale runner phase once a runner exists", () => {
  assert.equal(
    reconcileOnboardingPhase({
      phase: "runner",
      runnerCount: 1,
      readyRunnerCount: 0,
      agentCount: 0,
    }),
    "configuring",
  );
});

test("reconcileOnboardingPhase advances a stale configuring phase once a ready runner exists", () => {
  assert.equal(
    reconcileOnboardingPhase({
      phase: "configuring",
      runnerCount: 1,
      readyRunnerCount: 1,
      agentCount: 0,
    }),
    "agent",
  );
});

test("deriveEffectiveOnboardingPhase chooses runner when the company has no runners", () => {
  assert.equal(
    deriveEffectiveOnboardingPhase({
      runnerCount: 0,
      readyRunnerCount: 0,
      agentCount: 0,
    }),
    "runner",
  );
});

test("deriveEffectiveOnboardingPhase chooses configuring when runners exist but none are ready", () => {
  assert.equal(
    deriveEffectiveOnboardingPhase({
      runnerCount: 1,
      readyRunnerCount: 0,
      agentCount: 0,
    }),
    "configuring",
  );
});

test("deriveEffectiveOnboardingPhase chooses agent when a ready runner exists but agents do not", () => {
  assert.equal(
    deriveEffectiveOnboardingPhase({
      runnerCount: 1,
      readyRunnerCount: 1,
      agentCount: 0,
    }),
    "agent",
  );
});

test("deriveEffectiveOnboardingPhase clears onboarding when a ready runner and agent already exist", () => {
  assert.equal(
    deriveEffectiveOnboardingPhase({
      runnerCount: 1,
      readyRunnerCount: 1,
      agentCount: 1,
    }),
    null,
  );
});

test("getPostAgentCreationOnboardingRedirectPath returns the chats page for a new onboarding agent", () => {
  assert.equal(getPostAgentCreationOnboardingRedirectPath("agent-123"), "/chats?agentId=agent-123");
});
