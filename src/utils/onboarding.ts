import type { OnboardingPhase } from "./persistence.ts";

interface OnboardingCountState {
  runnerCount: number;
  readyRunnerCount: number;
  agentCount: number;
}

interface ReconcileOnboardingPhaseInput extends OnboardingCountState {
  phase: OnboardingPhase;
}

function normalizeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function deriveEffectiveOnboardingPhase({
  runnerCount,
  readyRunnerCount,
  agentCount,
}: OnboardingCountState): OnboardingPhase {
  const normalizedRunnerCount = normalizeCount(runnerCount);
  const normalizedReadyRunnerCount = normalizeCount(readyRunnerCount);
  const normalizedAgentCount = normalizeCount(agentCount);

  if (normalizedRunnerCount === 0) {
    return "runner";
  }
  if (normalizedReadyRunnerCount === 0) {
    return "configuring";
  }
  if (normalizedAgentCount === 0) {
    return "agent";
  }
  return null;
}

export function deriveInitialOnboardingPhase({
  runnerCount,
  agentCount,
}: Omit<OnboardingCountState, "readyRunnerCount">): OnboardingPhase {
  return deriveEffectiveOnboardingPhase({
    runnerCount,
    readyRunnerCount: runnerCount,
    agentCount,
  });
}

export function reconcileOnboardingPhase({
  phase,
  runnerCount,
  readyRunnerCount,
  agentCount,
}: ReconcileOnboardingPhaseInput): OnboardingPhase {
  if (phase === "runner" && normalizeCount(runnerCount) > 0) {
    return deriveEffectiveOnboardingPhase({ runnerCount, readyRunnerCount, agentCount });
  }

  if (phase === "configuring" && normalizeCount(readyRunnerCount) > 0) {
    return deriveEffectiveOnboardingPhase({ runnerCount, readyRunnerCount, agentCount });
  }

  if (phase === "agent" && normalizeCount(agentCount) > 0) {
    return "github";
  }

  if (phase === "github") {
    return "github";
  }

  return phase;
}
