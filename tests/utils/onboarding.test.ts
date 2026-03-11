import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveInitialOnboardingPhase,
  getPostAgentCreationOnboardingRedirectPath,
  reconcileOnboardingPhase,
} from "../../src/utils/onboarding.ts";

test("reconcileOnboardingPhase clears a stale agent phase when the company already has agents", () => {
  assert.equal(
    reconcileOnboardingPhase({
      phase: "agent",
      runnerCount: 1,
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
      agentCount: 0,
    }),
    "agent",
  );
});

test("deriveInitialOnboardingPhase chooses runner when the company has no runners", () => {
  assert.equal(
    deriveInitialOnboardingPhase({
      runnerCount: 0,
      agentCount: 0,
    }),
    "runner",
  );
});

test("deriveInitialOnboardingPhase chooses agent when runners exist but agents do not", () => {
  assert.equal(
    deriveInitialOnboardingPhase({
      runnerCount: 1,
      agentCount: 0,
    }),
    "agent",
  );
});

test("getPostAgentCreationOnboardingRedirectPath returns the chats page for a new onboarding agent", () => {
  assert.equal(getPostAgentCreationOnboardingRedirectPath("agent-123"), "/chats?agentId=agent-123");
});
