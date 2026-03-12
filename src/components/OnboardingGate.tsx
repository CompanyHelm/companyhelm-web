import { useEffect, useMemo } from "react";
import { isRunnerReadyAndConnected } from "../utils/formatting.ts";
import {
  deriveEffectiveOnboardingPhase,
  reconcileOnboardingPhase,
} from "../utils/onboarding.ts";
import type { OnboardingState } from "../utils/persistence.ts";
import { OnboardingPage, type OnboardingPageProps } from "../pages/OnboardingPage.tsx";

interface OnboardingGateProps extends Omit<OnboardingPageProps, "onboardingPhase" | "provisionedSecret" | "onboardingRunnerId"> {
  selectedCompanyId: string;
  skipOnboarding: boolean;
  hasLoadedAgentRunners: boolean;
  onboardingPhase: OnboardingState["phase"];
  onboardingRunnerId: string;
  onboardingRunnerSecret: string;
  agentRunners: OnboardingPageProps["agentRunners"];
  agents: Array<{ id?: string | null }>;
  setOnboardingPhase: (phase: OnboardingState["phase"]) => void;
  setOnboardingRunnerId: (runnerId: string) => void;
  setOnboardingRunnerSecret: (runnerSecret: string) => void;
  persistOnboarding: (state: Partial<OnboardingState>) => void;
}

function resolveOnboardingPhase({
  onboardingPhase,
  runnerCount,
  readyRunnerCount,
  agentCount,
}: {
  onboardingPhase: OnboardingState["phase"];
  runnerCount: number;
  readyRunnerCount: number;
  agentCount: number;
}) {
  if (onboardingPhase === null || onboardingPhase === "done") {
    return deriveEffectiveOnboardingPhase({
      runnerCount,
      readyRunnerCount,
      agentCount,
    });
  }

  return reconcileOnboardingPhase({
    phase: onboardingPhase,
    runnerCount,
    readyRunnerCount,
    agentCount,
  });
}

export function OnboardingGate({
  selectedCompanyId,
  skipOnboarding,
  hasLoadedAgentRunners,
  onboardingPhase,
  onboardingRunnerId,
  onboardingRunnerSecret,
  agentRunners,
  agents,
  setOnboardingPhase,
  setOnboardingRunnerId,
  setOnboardingRunnerSecret,
  persistOnboarding,
  ...onboardingPageProps
}: OnboardingGateProps) {
  const normalizedCompanyId = String(selectedCompanyId || "").trim();
  const normalizedRunnerId = String(onboardingRunnerId || "").trim();

  const onboardingCounts = useMemo(() => {
    const runnerCount = agentRunners.length;
    const readyRunnerCount = agentRunners.filter((runner) => isRunnerReadyAndConnected(runner)).length;
    const agentCount = agents.length;
    return { runnerCount, readyRunnerCount, agentCount };
  }, [agentRunners, agents.length]);

  const resolvedPhase = useMemo(() => {
    if (!normalizedCompanyId || skipOnboarding || !hasLoadedAgentRunners) {
      return null;
    }
    return resolveOnboardingPhase({
      onboardingPhase,
      ...onboardingCounts,
    });
  }, [hasLoadedAgentRunners, normalizedCompanyId, onboardingCounts, onboardingPhase, skipOnboarding]);

  const resolvedOnboardingRunnerId = useMemo(() => {
    if (normalizedRunnerId && agentRunners.some((runner) => String(runner?.id || "").trim() === normalizedRunnerId)) {
      return normalizedRunnerId;
    }
    return String(agentRunners[0]?.id || "").trim();
  }, [agentRunners, normalizedRunnerId]);

  useEffect(() => {
    if (!normalizedCompanyId || skipOnboarding || !hasLoadedAgentRunners) {
      return;
    }

    if (resolvedPhase === null) {
      if (onboardingPhase !== "done") {
        setOnboardingPhase("done");
      }
      if (normalizedRunnerId) {
        setOnboardingRunnerId("");
      }
      if (onboardingRunnerSecret) {
        setOnboardingRunnerSecret("");
      }
      persistOnboarding({
        phase: "done",
        runnerId: "",
        runnerSecret: "",
      });
      return;
    }

    if (onboardingPhase !== resolvedPhase) {
      setOnboardingPhase(resolvedPhase);
    }
    if (resolvedPhase !== "runner" && resolvedOnboardingRunnerId && resolvedOnboardingRunnerId !== normalizedRunnerId) {
      setOnboardingRunnerId(resolvedOnboardingRunnerId);
    }

    persistOnboarding({
      phase: resolvedPhase,
      runnerId: resolvedPhase === "runner" ? "" : resolvedOnboardingRunnerId,
      runnerSecret: resolvedPhase === "configuring" ? onboardingRunnerSecret : "",
    });
  }, [
    hasLoadedAgentRunners,
    normalizedCompanyId,
    normalizedRunnerId,
    onboardingPhase,
    onboardingRunnerSecret,
    persistOnboarding,
    resolvedOnboardingRunnerId,
    resolvedPhase,
    setOnboardingPhase,
    setOnboardingRunnerId,
    setOnboardingRunnerSecret,
    skipOnboarding,
  ]);

  if (!normalizedCompanyId || skipOnboarding || !hasLoadedAgentRunners || resolvedPhase === null) {
    return null;
  }

  return (
    <OnboardingPage
      {...onboardingPageProps}
      provisionedSecret={onboardingRunnerSecret}
      onboardingRunnerId={resolvedOnboardingRunnerId}
      agentRunners={agentRunners}
      onboardingPhase={resolvedPhase}
    />
  );
}
