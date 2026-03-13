import { useEffect, useMemo, useState } from "react";
import { isRunnerReadyAndConnected } from "../utils/formatting.ts";
import {
  deriveEffectiveOnboardingPhase,
  reconcileOnboardingPhase,
} from "../utils/onboarding.ts";
import { setBrowserPath } from "../utils/path.ts";
import type { CreatedAgentSummary } from "../utils/agent-creation.ts";
import type { OnboardingState } from "../utils/persistence.ts";
import { OnboardingPage, type OnboardingPageProps } from "../pages/OnboardingPage.tsx";

interface OnboardingGateProps extends Omit<
  OnboardingPageProps,
  "onboardingPhase" | "provisionedSecret" | "onboardingRunnerId" | "createdAgent" | "isCreatingPostCreateChat" | "onChatNow" | "onSkipPostCreate"
> {
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
  onCreateChatForAgent: (agentId: string) => Promise<void> | void;
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
  onCreateChatForAgent,
  ...onboardingPageProps
}: OnboardingGateProps) {
  const normalizedCompanyId = String(selectedCompanyId || "").trim();
  const normalizedRunnerId = String(onboardingRunnerId || "").trim();
  const [createdAgent, setCreatedAgent] = useState<CreatedAgentSummary | null>(null);
  const [isCreatingPostCreateChat, setIsCreatingPostCreateChat] = useState(false);

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
    if (createdAgent) {
      return "agent";
    }
    return resolveOnboardingPhase({
      onboardingPhase,
      ...onboardingCounts,
    });
  }, [createdAgent, hasLoadedAgentRunners, normalizedCompanyId, onboardingCounts, onboardingPhase, skipOnboarding]);

  const resolvedOnboardingRunnerId = useMemo(() => {
    if (normalizedRunnerId && agentRunners.some((runner) => String(runner?.id || "").trim() === normalizedRunnerId)) {
      return normalizedRunnerId;
    }
    return String(agentRunners[0]?.id || "").trim();
  }, [agentRunners, normalizedRunnerId]);

  // When the phase resolves to "agent" and we know which runner was created
  // during onboarding, auto-select it in the agent creation form so the user
  // doesn't have to manually pick the runner they just finished configuring.
  // This covers the auto-reconciliation path (configuring → agent) which
  // bypasses the onAdvanceToAgentPhase callback that normally pre-fills the form.
  useEffect(() => {
    if (
      resolvedPhase === "agent"
      && !createdAgent
      && resolvedOnboardingRunnerId
      && !String(onboardingPageProps.agentRunnerId || "").trim()
    ) {
      onboardingPageProps.onAgentRunnerChange(resolvedOnboardingRunnerId);
    }
  }, [
    resolvedPhase,
    createdAgent,
    resolvedOnboardingRunnerId,
    onboardingPageProps.agentRunnerId,
    onboardingPageProps.onAgentRunnerChange,
  ]);

  useEffect(() => {
    if (!normalizedCompanyId || skipOnboarding || !hasLoadedAgentRunners) {
      return;
    }
    if (createdAgent) {
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
      // Signal the parent to stop rendering the onboarding gate so the
      // main app content becomes visible (same reason as completeOnboarding).
      onboardingPageProps.onSkip();
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
    createdAgent,
  ]);

  function completeOnboarding() {
    setCreatedAgent(null);
    setOnboardingPhase("done");
    setOnboardingRunnerId("");
    setOnboardingRunnerSecret("");
    persistOnboarding({
      phase: "done",
      runnerId: "",
      runnerSecret: "",
    });
    // Tell the parent that onboarding is finished so it stops rendering the
    // onboarding gate and shows the main app content instead.  Without this
    // the `showOnboarding` flag stays true, OnboardingGate returns null, and
    // the user sees an empty page.
    onboardingPageProps.onSkip();
  }

  async function handleCreateAgent(event: Parameters<OnboardingPageProps["onCreateAgent"]>[0]) {
    const createdAgentName = String(onboardingPageProps.agentName || "").trim() || "New agent";
    const result = await onboardingPageProps.onCreateAgent(event);
    if (typeof result === "string") {
      setCreatedAgent({
        id: result,
        name: createdAgentName,
      });
    }
    return result;
  }

  async function handleChatNow() {
    if (!createdAgent?.id) {
      return;
    }

    try {
      setIsCreatingPostCreateChat(true);
      await onCreateChatForAgent(createdAgent.id);
      completeOnboarding();
    } finally {
      setIsCreatingPostCreateChat(false);
    }
  }

  function handleSkipPostCreate() {
    completeOnboarding();
    setBrowserPath("/agents");
  }

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
      onCreateAgent={handleCreateAgent}
      createdAgent={createdAgent}
      isCreatingPostCreateChat={isCreatingPostCreateChat}
      onChatNow={handleChatNow}
      onSkipPostCreate={handleSkipPostCreate}
    />
  );
}
