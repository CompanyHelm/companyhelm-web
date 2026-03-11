import { useState, useMemo, type ChangeEvent, type FormEvent } from "react";
import { Page } from "../components/Page.tsx";
import { quoteShellArg } from "../utils/shell.ts";
import { isRunnerReadyAndConnected } from "../utils/formatting.ts";
import {
  getRunnerCodexModelEntriesForRunner,
  getRunnerModelNames,
  getRunnerReasoningLevels,
  normalizeRunnerAvailableAgentSdks,
} from "../utils/normalization.ts";
import { AVAILABLE_AGENT_SDKS } from "../utils/constants.ts";
import type { AgentRunner } from "../types/domain.ts";

type DeployTarget = "local" | "vm" | null;

interface OnboardingPageProps {
  isCreatingRunner: boolean;
  runnerNameDraft: string;
  runnerError: string;
  provisionedSecret: string;
  agentRunners: AgentRunner[];
  agents: any[];
  onboardingPhase: "runner" | "agent" | "chat" | null;
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
  onCreateFirstChat: (agentId: string, message: string) => void;
  onSkipToChat: () => void;
  onAdvanceToAgentPhase: () => void;
}

const PHASES = [
  { key: "company", label: "Create company" },
  { key: "runner", label: "Create agent runner" },
  { key: "agent", label: "Create first agent" },
  { key: "chat", label: "Create first chat" },
] as const;

const DEFAULT_CHAT_MESSAGE = "Hi! Tell me a joke about AI agents";

export function OnboardingPage({
  isCreatingRunner,
  runnerNameDraft,
  runnerError,
  provisionedSecret,
  agentRunners,
  agents,
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
  onCreateFirstChat,
  onSkipToChat,
  onAdvanceToAgentPhase,
}: OnboardingPageProps) {
  const [deployTarget, setDeployTarget] = useState<DeployTarget>(null);
  const [chatMessage, setChatMessage] = useState(DEFAULT_CHAT_MESSAGE);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [createdAgentId, setCreatedAgentId] = useState("");

  const hasConnectedRunner = useMemo(
    () => agentRunners.some(isRunnerReadyAndConnected),
    [agentRunners],
  );

  const connectedRunners = useMemo(
    () => agentRunners.filter(isRunnerReadyAndConnected),
    [agentRunners],
  );

  const currentPhase = onboardingPhase || "runner";
  const phaseIndex = PHASES.findIndex((p) => p.key === currentPhase);

  const showRunnerSection = currentPhase === "runner";
  const showAgentSection = currentPhase === "agent";
  const showChatSection = currentPhase === "chat";

  const localStartCommand = useMemo(() => {
    const secret = provisionedSecret || "<RUNNER_SECRET>";
    return `npx companyhelm runner start --use-host-docker-runtime --secret ${quoteShellArg(secret)} --daemon`;
  }, [provisionedSecret]);

  const vmAuthCommand = "npx companyhelm sdk codex use-dedicated-auth";

  const vmStartCommand = useMemo(() => {
    const secret = provisionedSecret || "<RUNNER_SECRET>";
    return `npx companyhelm runner start --secret ${quoteShellArg(secret)} --daemon`;
  }, [provisionedSecret]);

  // Agent form derived state
  const createRunnerCodexModelEntries = useMemo(() => {
    return getRunnerCodexModelEntriesForRunner(runnerCodexModelEntriesById, agentRunnerId);
  }, [agentRunnerId, runnerCodexModelEntriesById]);

  const createRunnerSdkAvailabilityByName = useMemo(() => {
    const selectedRunner = agentRunners.find((runner) => runner.id === agentRunnerId) || null;
    const sdkEntries = selectedRunner ? normalizeRunnerAvailableAgentSdks(selectedRunner) : [];
    return sdkEntries.reduce((map: Map<string, "available" | "unavailable">, sdkEntry: any) => {
      map.set(sdkEntry.name, sdkEntry.isAvailable ? "available" : "unavailable");
      return map;
    }, new Map<string, "available" | "unavailable">());
  }, [agentRunners, agentRunnerId]);

  const createRunnerModelNames = useMemo(() => {
    return getRunnerModelNames(createRunnerCodexModelEntries);
  }, [createRunnerCodexModelEntries]);

  const createRunnerReasoningLevels = useMemo(() => {
    return getRunnerReasoningLevels(createRunnerCodexModelEntries, agentModel);
  }, [agentModel, createRunnerCodexModelEntries]);

  // Agent for chat phase: prefer the one we just created, else last in list
  const chatAgent = useMemo(() => {
    if (createdAgentId) {
      return agents.find((a: any) => a.id === createdAgentId) || null;
    }
    return agents.length > 0 ? agents[agents.length - 1] : null;
  }, [agents, createdAgentId]);

  async function handleStartChat() {
    if (!chatAgent || !chatMessage.trim()) return;
    setIsCreatingChat(true);
    try {
      await onCreateFirstChat(chatAgent.id, chatMessage.trim());
    } finally {
      setIsCreatingChat(false);
    }
  }

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

              {provisionedSecret ? (
                <>
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
                </>
              ) : null}
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
                  <p className="runner-onboarding-step-label">2. Authenticate Codex with dedicated credentials</p>
                  <p className="subcopy">
                    Run the following command on your VM and complete the device code flow from the CLI:
                  </p>
                  <pre className="runner-command"><code>{vmAuthCommand}</code></pre>
                </div>

                <div className="runner-onboarding-step">
                  <p className="runner-onboarding-step-label">3. Start the runner</p>
                  <p className="subcopy">
                    After authentication, start the runner as a background daemon:
                  </p>
                  <pre className="runner-command"><code>{vmStartCommand}</code></pre>
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
                <button
                  type="button"
                  disabled={!hasConnectedRunner}
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
                <h1>Create your first agent</h1>
                <p className="subcopy">
                  An agent is an AI-powered worker that runs tasks inside your runner.
                  You can add MCP servers, skills, and additional instructions later from the Agent page.
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

            <form className="onboarding-agent-form" onSubmit={async (event) => {
              const result = await onCreateAgent(event);
              if (result && typeof result === "string") {
                setCreatedAgentId(result);
              }
            }}>
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
                    {runner.name || runner.id.slice(0, 8)} ({isRunnerReadyAndConnected(runner) ? "connected" : "offline"})
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
                required
                disabled={isCreatingAgent || !agentRunnerId || !agentModel}
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

              <button type="submit" disabled={isCreatingAgent || !hasConnectedRunner}>
                {isCreatingAgent ? "Creating..." : "Create agent"}
              </button>
              {agentError ? <p className="error-banner">{agentError}</p> : null}
            </form>
          </section>
        ) : null}

        {/* ── Chat phase ── */}
        {showChatSection ? (
          <section className="panel runner-onboarding-panel">
            <div className="runner-onboarding-header">
              <div>
                <p className="eyebrow">Setup</p>
                <h1>Start your first chat</h1>
                <p className="subcopy">
                  Send a message to your new agent to start a conversation.
                  You can edit the message below or write your own.
                </p>
              </div>
              <button
                type="button"
                className="runner-onboarding-skip-btn"
                onClick={onSkipToChat}
              >
                Skip for now
              </button>
            </div>

            <div className="onboarding-chat-form">
              <label htmlFor="onboarding-chat-message">Your first message</label>
              <textarea
                id="onboarding-chat-message"
                value={chatMessage}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setChatMessage(event.target.value)}
                rows={3}
                disabled={isCreatingChat}
                placeholder="Type your first message..."
              />
              {chatAgent ? (
                <p className="onboarding-chat-agent-label">
                  Chatting with <strong>{chatAgent.name || `Agent ${chatAgent.id?.slice(0, 8)}`}</strong>
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleStartChat}
                disabled={isCreatingChat || !chatAgent || !chatMessage.trim()}
              >
                {isCreatingChat ? "Starting chat..." : "Start chatting"}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </Page>
  );
}
