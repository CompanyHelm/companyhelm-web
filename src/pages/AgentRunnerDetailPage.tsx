import { useMemo } from "react";
import { Page } from "../components/Page.tsx";
import { CodexAuthPanel } from "../components/CodexAuthPanel.tsx";
import {
  formatTimestamp,
  normalizeRunnerConnectionState,
} from "../utils/formatting.ts";
import { normalizeRunnerAvailableAgentSdks, normalizeRunnerCodexAvailableModels } from "../utils/normalization.ts";
import { DEFAULT_AGENT_SDK } from "../utils/constants.ts";
import { getChatsPath, setBrowserPath } from "../utils/path.ts";
import { buildRunnerStartCommand } from "../utils/shell.ts";
import { getIgnoredSecretInputProps } from "../utils/autofill.ts";

function formatAvailabilityLabel(value: string, isAvailable: boolean) {
  return `${value} (${isAvailable ? "available" : "unavailable"})`;
}

export function AgentRunnerDetailPage({
  runner,
  agents,
  agentRunnerLookup,
  runnerGrpcTarget,
  runnerSecretsById,
  regeneratingRunnerId,
  deletingRunnerId,
  onRunnerCommandSecretChange,
  onRegenerateRunnerSecret,
  onDeleteRunner,
  codexAuthEvent,
  isStartingCodexAuth,
  onStartCodexDeviceAuth,
}: any) {
  const connectionState = normalizeRunnerConnectionState(runner.isConnected);
  const runnerSecret = runnerSecretsById[runner.id] || "";
  const availableAgentSdks = normalizeRunnerAvailableAgentSdks(runner);
  const availableSdkNames = availableAgentSdks.map((entry: any) => entry.name);
  const codexSdk = availableAgentSdks.find((entry: any) => entry.name === DEFAULT_AGENT_SDK) || null;
  const codexAvailableModels = normalizeRunnerCodexAvailableModels(runner);
  const availableCodexModelCount = codexAvailableModels.filter((entry: any) => entry.isAvailable).length;
  const isBusy = deletingRunnerId === runner.id || regeneratingRunnerId === runner.id;

  const assignedAgents = useMemo(() => {
    return agents.filter((agent: any) => agent.agentRunnerId === runner.id);
  }, [agents, runner.id]);

  const runnerCommand = useMemo(() => {
    const secret = runnerSecret || "<RUNNER_SECRET>";
    return buildRunnerStartCommand({
      runnerSecret: secret,
      daemon: true,
    });
  }, [runnerSecret]);

  return (
    <Page><div className="page-stack">
      <section className="dashboard-grid">
        <article className="panel stat-panel">
          <p className="stat-label">Connected</p>
          <p className="stat-value">
            <span className={`runner-status runner-status-${connectionState}`}>
              {connectionState}
            </span>
          </p>
          <p className="stat-footnote">Last seen {formatTimestamp(runner.lastSeenAt)}</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Codex SDK</p>
          <p className="stat-value">{codexSdk?.status || "unreported"}</p>
          <p className="stat-footnote">{codexSdk?.codexAuthStatus || "idle"}</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Agents</p>
          <p className="stat-value">{assignedAgents.length}</p>
          <p className="stat-footnote">assigned to this runner</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Models</p>
          <p className="stat-value">{availableCodexModelCount}</p>
          <p className="stat-footnote">{codexAvailableModels.length} reported</p>
        </article>
      </section>

      <section className="panel list-panel">
        <h2 className="panel-section-title">Assigned Agents</h2>
        {assignedAgents.length === 0 ? (
          <p className="empty-hint">No agents assigned to this runner.</p>
        ) : (
          <ul className="chat-card-list">
            {assignedAgents.map((agent: any) => {
              const modelLabel = String(agent.model || "").trim() || "n/a";
              return (
                <li
                  key={agent.id}
                  className="chat-card"
                  onClick={() => setBrowserPath(getChatsPath({ agentId: agent.id }))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event: any) => {
                    if (event.key === "Enter") {
                      setBrowserPath(getChatsPath({ agentId: agent.id }));
                    }
                  }}
                >
                  <div className="chat-card-main">
                    <p className="chat-card-title">
                      <strong>{agent.name || "Unnamed agent"}</strong>
                    </p>
                    <p className="chat-card-meta">
                      SDK: {agent.agentSdk} · model: {modelLabel}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel list-panel">
        <h2 className="panel-section-title">{DEFAULT_AGENT_SDK} Models</h2>
        {codexAvailableModels.length === 0 ? (
          <p className="empty-hint">No models reported yet.</p>
        ) : (
          <div className="runner-models-list">
            {codexAvailableModels.map((entry: any, index: any) => {
              const reasoningLabel = entry.reasoning.join(", ");
              return (
                <span
                  key={`${entry.name}-${index}`}
                  className="runner-model-pill"
                  title={
                    reasoningLabel
                      ? `${formatAvailabilityLabel(entry.name, entry.isAvailable)} (${reasoningLabel})`
                      : formatAvailabilityLabel(entry.name, entry.isAvailable)
                  }
                >
                  <span className="runner-model-name">{entry.name}</span>
                  <span
                    className={`availability-badge${entry.isAvailable ? "" : " availability-badge-unavailable"}`}
                  >
                    {entry.isAvailable ? "available" : "unavailable"}
                  </span>
                  {entry.reasoning.length > 0 ? (
                    <span className="runner-model-reasons">
                      {entry.reasoning.map((level: any, reasonIndex: any) => (
                        <span
                          key={`${entry.name}-${index}-reason-${reasonIndex}`}
                          className="runner-model-reason"
                        >
                          {level}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel list-panel">
        <h2 className="panel-section-title">Connection</h2>
        <div className="chat-settings-modal-form">
          <div className="chat-settings-field">
            <span className="chat-settings-label">Runner ID</span>
            <p className="chat-settings-readonly">{runner.id}</p>
          </div>

          <div className="chat-settings-field">
            <span className="chat-settings-label">gRPC target</span>
            <p className="chat-settings-readonly">{runnerGrpcTarget || "-"}</p>
          </div>

          <div className="chat-settings-field">
            <span className="chat-settings-label">Last health check</span>
            <p className="chat-settings-readonly">{formatTimestamp(runner.lastHealthCheckAt)}</p>
          </div>

          <div className="chat-settings-field">
            <span className="chat-settings-label">SDK catalog</span>
            {availableSdkNames.length > 0 ? (
              <div className="runner-models-list">
                {availableAgentSdks.map((sdkEntry: any) => (
                  <span
                    key={`${runner.id}-sdk-${sdkEntry.name}`}
                    className="runner-model-pill"
                    title={`${sdkEntry.name} (${sdkEntry.status || "unconfigured"})`}
                  >
                    <span className="runner-model-name">{sdkEntry.name}</span>
                    <span
                      className={`availability-badge${sdkEntry.isAvailable ? "" : " availability-badge-unavailable"}`}
                    >
                      {sdkEntry.status || (sdkEntry.isAvailable ? "available" : "unavailable")}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="chat-settings-readonly">none reported</p>
            )}
          </div>

          <div className="chat-settings-field">
            <span className="chat-settings-label">CLI command</span>
            <pre className="runner-command runner-command-inline">
              <code>{runnerCommand}</code>
            </pre>
          </div>

          <div className="chat-settings-field">
            <label htmlFor={`detail-runner-secret-${runner.id}`} className="chat-settings-label">
              Runner secret
            </label>
            <input
              id={`detail-runner-secret-${runner.id}`}
              className="chat-settings-input"
              type="text"
              value={runnerSecret}
              onChange={(event: any) =>
                onRunnerCommandSecretChange(runner.id, event.target.value)
              }
              placeholder="Paste runner secret to complete command"
              {...getIgnoredSecretInputProps("runnerSecret")}
              disabled={isBusy}
            />
            {!runnerSecret ? (
              <p className="runner-command-hint">
                Secret is only shown at provisioning time. Paste it here to complete the CLI command.
              </p>
            ) : null}
            <button
              type="button"
              className="secondary-btn"
              onClick={() => onRegenerateRunnerSecret(runner.id)}
              disabled={isBusy}
              style={{ marginTop: "0.5rem" }}
            >
              {regeneratingRunnerId === runner.id ? "Regenerating..." : "Regenerate key"}
            </button>
          </div>
        </div>
      </section>

      <CodexAuthPanel
        sdk={codexSdk}
        runnerId={runner.id}
        authEvent={codexAuthEvent}
        isRunnerConnected={runner.isConnected === true}
        isStarting={isStartingCodexAuth}
        onStartDeviceCodeAuth={onStartCodexDeviceAuth}
      />

      <section className="panel list-panel">
        <div className="chat-settings-actions">
          <button
            type="button"
            className="danger-btn"
            onClick={() => {
              onDeleteRunner(runner.id);
              setBrowserPath("/agent-runner");
            }}
            disabled={isBusy}
          >
            {deletingRunnerId === runner.id ? "Deleting..." : "Delete runner"}
          </button>
        </div>
      </section>
    </div></Page>
  );
}
