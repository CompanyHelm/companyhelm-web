import type { OnboardingPhase } from "./persistence.ts";
import { getChatsPath } from "./path.ts";

interface OnboardingCountState {
  runnerCount: number;
  agentCount: number;
}

interface ReconcileOnboardingPhaseInput extends OnboardingCountState {
  phase: OnboardingPhase;
}

function normalizeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function deriveInitialOnboardingPhase({
  runnerCount,
  agentCount,
}: OnboardingCountState): OnboardingPhase {
  const normalizedRunnerCount = normalizeCount(runnerCount);
  const normalizedAgentCount = normalizeCount(agentCount);

  if (normalizedRunnerCount === 0) {
    return "runner";
  }
  if (normalizedAgentCount === 0) {
    return "agent";
  }
  return null;
}

export function reconcileOnboardingPhase({
  phase,
  runnerCount,
  agentCount,
}: ReconcileOnboardingPhaseInput): OnboardingPhase {
  if (phase === "runner" && normalizeCount(runnerCount) > 0) {
    return deriveInitialOnboardingPhase({ runnerCount, agentCount });
  }

  if (phase === "agent" && normalizeCount(agentCount) > 0) {
    return null;
  }

  return phase;
}

export function getPostAgentCreationOnboardingRedirectPath(agentId: string): string {
  return getChatsPath({ agentId: String(agentId || "").trim() });
}
