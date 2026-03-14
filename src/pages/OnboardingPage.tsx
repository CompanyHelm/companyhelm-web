import { useState, useMemo, type ChangeEvent, type FormEvent } from "react";
import { AgentCreatedActions } from "../components/AgentCreatedActions.tsx";
import { CodexAuthPanel } from "../components/CodexAuthPanel.tsx";
import { Page } from "../components/Page.tsx";
import { buildRunnerStartCommand } from "../utils/shell.ts";
import { formatRunnerLabel, isRunnerReadyAndConnected } from "../utils/formatting.ts";
import { getAgentCreationFormStatus, type CreatedAgentSummary } from "../utils/agent-creation.ts";
import {
  getRunnerCodexModelEntriesForRunner,
  getRunnerModelNames,
  getRunnerReasoningLevels,
  normalizeRunnerAvailableAgentSdks,
} from "../utils/normalization.ts";
import { AVAILABLE_AGENT_SDKS } from "../utils/constants.ts";
import type { AgentRunner, RunnerSdkCodexAuthEvent } from "../types/domain.ts";
import type { OnboardingPhase } from "../utils/persistence.ts";

type DeployTarget = "local" | "vm" | null;

export interface OnboardingPageProps {
  isCreatingRunner: boolean;
  runnerNameDraft: string;
  runnerError: string;
  provisionedSecret: string;
  onboardingRunnerId: string;
  agentRunners: AgentRunner[];
  onboardingPhase: OnboardingPhase;
  onRunnerNameChange: (value: string) => void;
  onCreateRunner: (event: FormEvent<HTMLFormElement>) => Promise<boolean> | boolean;
  onSkip: () => void;
  isCreatingAgent: boolean;
  agentName: string;
  agentRunnerId: string;
  agentSdk: string;
  agentModel: string;
  agentModelReasoningLevel: string;
  agentError: string;
  runnerCodexModelEntriesById: Map<any, any>;
  onAgentNameChange: (value: string) => void;
  onAgentRunnerChange: (runnerId: string) => void;
  onAgentSdkChange: (sdk: string) => void;
  onAgentModelChange: (model: string) => void;
  onAgentModelReasoningLevelChange: (level: string) => void;
  onCreateAgent: (event: FormEvent<HTMLFormElement>) => Promise<any>;
  createdAgent: CreatedAgentSummary | null;
  isCreatingPostCreateChat: boolean;
  onChatNow: () => void;
  onSkipPostCreate: () => void;
  onAdvanceToAgentPhase: () => void;
  codexAuthEvent: RunnerSdkCodexAuthEvent | null;
  isStartingCodexAuth: boolean;
  onStartCodexDeviceAuth: (runnerId: string, sdkId: string) => void;
}

const PHASES = [
  { key: "company", label: "Create company" },
  { key: "runner", label: "Create agent runner" },
  { key: "configuring", label: "Configuring runner" },
  { key: "agent", label: "Create first agent" },
] as const;

export function OnboardingPage({
  isCreatingRunner,
  runnerNameDraft,
  runnerError,
  provisionedSecret,
  onboardingRunnerId,
  agentRunners,
  onboardingPhase,
  onRunnerNameChange,
  onCreateRunner,
  onSkip,
  isCreatingAgent,
  agentName,
  agentRunnerId,
  agentSdk,
  agentModel,
  agentModelReasoningLevel,
  agentError,
  runnerCodexModelEntriesById,
  onAgentNameChange,
  onAgentRunnerChange,
  onAgentSdkChange,
  onAgentModelChange,
  onAgentModelReasoningLevelChange,
  onCreateAgent,
  createdAgent,
  isCreatingPostCreateChat,
  onChatNow,
  onSkipPostCreate,
  onAdvanceToAgentPhase,
  codexAuthEvent,
  isStartingCodexAuth,
  onStartCodexDeviceAuth,
}: OnboardingPageProps) {
  const [deployTarget, setDeployTarget] = useState<DeployTarget>(null);
  const showSelfHostedRunnerUrlHint =
    typeof window !== "undefined" && window.location.hostname !== "app.companyhelm.com";

  const onboardingRunner = useMemo(
    () => agentRunners.find((runner) => runner.id === onboardingRunnerId) || null,
    [agentRunners, onboardingRunnerId],
  );

  const hasConnectedRunner = useMemo(
    () => onboardingRunner?.isConnected === true,
    [onboardingRunner],
  );

  const hasConfiguredRunner = useMemo(
    () => onboardingRunner ? isRunnerReadyAndConnected(onboardingRunner) : false,
    [onboardingRunner],
  );

  const currentPhase = onboardingPhase || "runner";
  const phaseIndex = PHASES.findIndex((p) => p.key === currentPhase);

  const showRunnerSection = currentPhase === "runner";
  const showConfiguringSection = currentPhase === "configuring";
  const showAgentSection = currentPhase === "agent";

  const localStartCommand = useMemo(() => {
    const secret = provisionedSecret || "<RUNNER_SECRET>";
    return buildRunnerStartCommand({
      runnerSecret: secret,
      daemon: true,
    });
  }, [provisionedSecret]);

  const vmStartCommand = useMemo(() => {
    const secret = provisionedSecret || "<RUNNER_SECRET>";
    return buildRunnerStartCommand({
      runnerSecret: secret,
      daemon: true,
    });
  }, [provisionedSecret]);

  const onboardingCodexSdk = useMemo(() => {
    if (!onboardingRunner) {
      return null;
    }
    return normalizeRunnerAvailableAgentSdks(onboardingRunner)
      .find((sdkEntry) => sdkEntry.name === "codex") || null;
  }, [onboardingRunner]);

  // Agent form derived state
  const createRunnerCodexModelEntries = useMemo(() => {
    return getRunnerCodexModelEntriesForRunner(runnerCodexModelEntriesById, agentRunnerId);
  }, [agentRunnerId, runnerCodexModelEntriesById]);

  const createRunnerSdkAvailabilityByName = useMemo(() => {
    const selectedRunner = agentRunners.find((runner) => runner.id === agentRunnerId) || null;
    const sdkEntries = selectedRunner ? normalizeRunnerAvailableAgentSdks(selectedRunner) : [];
    return sdkEntries.reduce((map: Map<string, "available" | "unavailable">, sdkEntry: any) => {
      map.set(sdkEntry.name, sdkEntry.isAvailable && sdkEntry.status === "ready" ? "available" : "unavailable");
      return map;
    }, new Map<string, "available" | "unavailable">());
  }, [agentRunners, agentRunnerId]);

  const createRunnerModelNames = useMemo(() => {
    return getRunnerModelNames(createRunnerCodexModelEntries);
  }, [createRunnerCodexModelEntries]);

  const createRunnerReasoningLevels = useMemo(() => {
    return getRunnerReasoningLevels(createRunnerCodexModelEntries, agentModel);
  }, [agentModel, createRunnerCodexModelEntries]);

  const createFormStatus = useMemo(() => {
    return getAgentCreationFormStatus({
      agentRunners,
      runnerCodexModelEntriesById,
      agentName,
      agentRunnerId,
      agentSdk,
      agentModel,
      agentModelReasoningLevel,
      allowEmptyReasoningWhenUnavailable: true,
    });
  }, [
    agentModel,
    agentModelReasoningLevel,
    agentName,
    agentRunnerId,
    agentRunners,
    agentSdk,
    runnerCodexModelEntriesById,
  ]);

  return (
    <Page>
      <div className="page-stack">
        <nav className="onboarding-stepper">
          {PHASES.map((phase, i) => {
            const isComplete = i < phaseIndex;
            const isCurrent = i === phaseIndex;
            const stateClass = isComplete
              ? " onboarding-step-complete"
              : isCurrent
                ? " onboarding-step-current"
                : "";
            return (
              <div key={phase.key} className={`onboarding-step${stateClass}`}>
                {i > 0 ? <span className={`onboarding-step-line${i <= phaseIndex ? " onboarding-step-line-filled" : ""}`} /> : null}
                <span className="onboarding-step-circle">
                  {isComplete ? (
                    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                      <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </span>
                <span className="onboarding-step-label">{phase.label}</span>
              </div>
            );
          })}
        </nav>

        {/* ── Runner phase ── */}
        {showRunnerSection ? (
          <>
            <section className="panel runner-onboarding-panel">
              <div className="runner-onboarding-header">
                <div>
                  <p className="eyebrow">Setup</p>
                  <h1>Create your agent runner</h1>
                  <p className="subcopy">
                    An agent runner provides an isolated Docker environment where your agents
                    execute tasks securely. Register one to get started.
                  </p>
                </div>
                <button
                  type="button"
                  className="runner-onboarding-skip-btn"
                  onClick={onSkip}
                >
                  Skip for now
                </button>
              </div>

              {!provisionedSecret ? (
                <form className="runner-onboarding-form" onSubmit={onCreateRunner}>
                  <label htmlFor="onboarding-runner-name">Runner name</label>
                  <input
                    id="onboarding-runner-name"
                    value={runnerNameDraft}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      onRunnerNameChange(event.target.value)
                    }
                    placeholder="e.g. My Local Runner"
                    disabled={isCreatingRunner}
                    autoFocus
                    required
                  />
                  <button type="submit" disabled={isCreatingRunner}>
                    {isCreatingRunner ? "Creating..." : "Create runner"}
                  </button>
                  {runnerError ? <p className="error-banner">{runnerError}</p> : null}
                </form>
              ) : null}
            </section>
          </>
        ) : null}

        {showConfiguringSection ? (
          <>
            <section className="panel runner-onboarding-panel">
              <div className="runner-onboarding-header">
                <div>
                  <p className="eyebrow">Setup</p>
                  <h1>Configuring runner</h1>
                  <p className="subcopy">
                    Your runner has been created. Start it, complete Codex auth, and wait for it to
                    report ready before creating your first agent.
                  </p>
                </div>
                <button
                  type="button"
                  className="runner-onboarding-skip-btn"
                  onClick={onSkip}
                >
                  Skip for now
                </button>
              </div>

              <p className="runner-onboarding-section-title">Where will this runner run?</p>
              <div className="runner-onboarding-targets">
                <button
                  type="button"
                  className={`runner-onboarding-target-btn${deployTarget === "local" ? " runner-onboarding-target-btn-active" : ""}`}
                  onClick={() => setDeployTarget("local")}
                >
                  <svg className="runner-onboarding-target-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                    <rect x="4" y="8" width="40" height="26" rx="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <line x1="14" y1="40" x2="34" y2="40" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="24" y1="34" x2="24" y2="40" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                  <span className="runner-onboarding-target-label">Local Machine</span>
                  <span className="runner-onboarding-target-desc">Docker on your computer</span>
                </button>
                <button
                  type="button"
                  className={`runner-onboarding-target-btn${deployTarget === "vm" ? " runner-onboarding-target-btn-active" : ""}`}
                  onClick={() => setDeployTarget("vm")}
                >
                  <svg className="runner-onboarding-target-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                    <rect x="10" y="4" width="28" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <line x1="18" y1="10" x2="30" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="18" y1="15" x2="30" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="18" y1="20" x2="30" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="24" cy="34" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <span className="runner-onboarding-target-label">VPS / VM</span>
                  <span className="runner-onboarding-target-desc">Deploy on remote Linux infrastructure</span>
                </button>
              </div>
            </section>

            {provisionedSecret && deployTarget === "local" ? (
              <section className="panel runner-onboarding-config-panel">
                <h2>Set up your local runner</h2>

                <div className="runner-onboarding-step">
                  <p className="runner-onboarding-step-label">1. Install Docker Desktop</p>
                  <p className="subcopy">
                    Download and install{" "}
                    <a
                      href="https://www.docker.com/products/docker-desktop/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Docker Desktop
                    </a>{" "}
                    for your operating system. Make sure it is running before proceeding.
                  </p>
                </div>

                <div className="runner-onboarding-step">
                  <p className="runner-onboarding-step-label">2. Start the runner</p>
                  <p className="subcopy">
                    Run this command to start the runner in the background using your host Docker runtime:
                  </p>
                  <pre className="runner-command"><code>{localStartCommand}</code></pre>
                  {showSelfHostedRunnerUrlHint ? (
                    <p className="subcopy">
                      This Company Helm instance is not running on Company Helm Cloud. Add explicit{" "}
                      <code>--server-url</code> and <code>--agent-api-url</code> values that point to
                      your deployment. If the runner is running on the same machine as Company Helm,
                      use <code>--server-url http://localhost:50051</code> and{" "}
                      <code>--agent-api-url http://localhost:50052</code>.
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {provisionedSecret && deployTarget === "vm" ? (
              <section className="panel runner-onboarding-config-panel">
                <h2>Set up your remote runner</h2>

                <div className="runner-onboarding-step">
                  <p className="runner-onboarding-step-label">1. Install Docker on your VM</p>
                  <p className="subcopy">
                    Follow the{" "}
                    <a
                      href="https://docs.docker.com/engine/install/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      official Docker install guide
                    </a>
                    , or run:
                  </p>
                  <pre className="runner-command"><code>{`curl -fsSL https://get.docker.com | sh`}</code></pre>
                </div>

                <div className="runner-onboarding-step">
                  <p className="runner-onboarding-step-label">2. Start the runner</p>
                  <p className="subcopy">
                    Start the runner as a background daemon. You will trigger Codex device auth from the UI after it connects:
                  </p>
                  <pre className="runner-command"><code>{vmStartCommand}</code></pre>
                  {showSelfHostedRunnerUrlHint ? (
                    <p className="subcopy">
                      This Company Helm instance is not running on Company Helm Cloud. Add explicit{" "}
                      <code>--server-url</code> and <code>--agent-api-url</code> values that point to
                      your deployment. If the runner is running on the same machine as Company Helm,
                      use <code>--server-url http://localhost:50051</code> and{" "}
                      <code>--agent-api-url http://localhost:50052</code>.
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {provisionedSecret && deployTarget ? (
              <section className={`panel runner-onboarding-connection-panel${hasConnectedRunner ? " runner-onboarding-connection-panel-connected" : ""}`}>
                <div className="runner-onboarding-connection-status">
                  <span className={`runner-onboarding-connection-dot${hasConnectedRunner ? " runner-onboarding-connection-dot-connected" : ""}`} />
                  <span className="runner-onboarding-connection-label">
                    {hasConnectedRunner ? "Runner connected" : "Waiting for runner to connect..."}
                  </span>
                </div>
                {onboardingRunner && onboardingCodexSdk ? (
                  <CodexAuthPanel
                    sdk={onboardingCodexSdk}
                    runnerId={onboardingRunner.id}
                    authEvent={codexAuthEvent}
                    isRunnerConnected={hasConnectedRunner}
                    isStarting={isStartingCodexAuth}
                    onStartDeviceCodeAuth={onStartCodexDeviceAuth}
                  />
                ) : null}
                <button
                  type="button"
                  disabled={!hasConfiguredRunner}
                  onClick={onAdvanceToAgentPhase}
                >
                  Create your first agent
                </button>
              </section>
            ) : null}
          </>
        ) : null}

        {/* ── Agent phase ── */}
        {showAgentSection ? (
          <section className="panel runner-onboarding-panel">
            <div className="runner-onboarding-header">
              <div>
                <p className="eyebrow">Setup</p>
                <h1>{createdAgent ? "Your first agent is ready" : "Create your first agent"}</h1>
                <p className="subcopy">
                  {createdAgent
                    ? "Start a conversation now or leave this agent ready for later."
                    : "An agent is an AI-powered worker that runs tasks inside your runner. You can add MCP servers, skills, and additional instructions later from the Agent page."}
                </p>
              </div>
              {!createdAgent ? (
                <button
                  type="button"
                  className="runner-onboarding-skip-btn"
                  onClick={onSkip}
                >
                  Skip for now
                </button>
              ) : null}
            </div>

            {createdAgent ? (
              <AgentCreatedActions
                agentName={createdAgent.name}
                isCreatingChat={isCreatingPostCreateChat}
                onChatNow={onChatNow}
                onSkipForNow={onSkipPostCreate}
              />
            ) : (
              <form className="onboarding-agent-form" onSubmit={onCreateAgent}>
                <label htmlFor="onboarding-agent-name">Agent name</label>
                <input
                  id="onboarding-agent-name"
                  value={agentName}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => onAgentNameChange(event.target.value)}
                  placeholder="e.g. CEO Agent"
                  disabled={isCreatingAgent}
                  autoFocus
                  required
                />

                <label htmlFor="onboarding-agent-runner">Runner</label>
                <select
                  id="onboarding-agent-runner"
                  value={agentRunnerId}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => onAgentRunnerChange(event.target.value)}
                  required
                  disabled={isCreatingAgent}
                >
                  <option value="">Select a runner</option>
                  {agentRunners.map((runner) => (
                    <option
                      key={runner.id}
                      value={runner.id}
                      disabled={!isRunnerReadyAndConnected(runner)}
                    >
                      {formatRunnerLabel(runner)} ({isRunnerReadyAndConnected(runner) ? "connected" : "offline"})
                    </option>
                  ))}
                </select>

                <label htmlFor="onboarding-agent-sdk">Agent SDK</label>
                <select
                  id="onboarding-agent-sdk"
                  value={agentSdk}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => onAgentSdkChange(event.target.value)}
                  required
                  disabled={isCreatingAgent}
                >
                  {AVAILABLE_AGENT_SDKS.map((sdkName) => (
                    <option
                      key={sdkName}
                      value={sdkName}
                      disabled={Boolean(agentRunnerId) && createRunnerSdkAvailabilityByName.get(sdkName) !== "available"}
                    >
                      {sdkName}
                    </option>
                  ))}
                </select>

                <label htmlFor="onboarding-agent-model">Default model</label>
                <select
                  id="onboarding-agent-model"
                  value={agentModel}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => onAgentModelChange(event.target.value)}
                  required
                  disabled={isCreatingAgent || !agentRunnerId}
                >
                  {!agentRunnerId ? (
                    <option value="">Select a runner first</option>
                  ) : createRunnerCodexModelEntries.length === 0 ? (
                    <option value="">No models reported by runner</option>
                  ) : createRunnerModelNames.length === 0 ? (
                    <option value="">No available models</option>
                  ) : (
                    <>
                      <option value="">Select model</option>
                      {createRunnerCodexModelEntries.map((modelEntry: any) => (
                        <option
                          key={modelEntry.name}
                          value={modelEntry.name}
                          disabled={!modelEntry.isAvailable}
                        >
                          {modelEntry.name}{modelEntry.isAvailable ? "" : " (unavailable)"}
                        </option>
                      ))}
                    </>
                  )}
                </select>

                <label htmlFor="onboarding-agent-reasoning">Default reasoning level</label>
                <select
                  id="onboarding-agent-reasoning"
                  value={agentModelReasoningLevel}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => onAgentModelReasoningLevelChange(event.target.value)}
                  required={createRunnerReasoningLevels.length > 0}
                  disabled={isCreatingAgent || !agentRunnerId || !agentModel || createRunnerReasoningLevels.length === 0}
                >
                  {!agentRunnerId ? (
                    <option value="">Select a runner first</option>
                  ) : !agentModel ? (
                    <option value="">Select a model first</option>
                  ) : createRunnerReasoningLevels.length === 0 ? (
                    <option value="">No reasoning levels for this model</option>
                  ) : (
                    <>
                      <option value="">Select reasoning level</option>
                      {createRunnerReasoningLevels.map((level: string) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </>
                  )}
                </select>

                <button type="submit" disabled={isCreatingAgent || !createFormStatus.canSubmit}>
                  {isCreatingAgent ? "Creating..." : "Create agent"}
                </button>
                {agentError ? <p className="error-banner">{agentError}</p> : null}
              </form>
            )}
          </section>
        ) : null}
      </div>
    </Page>
  );
}
