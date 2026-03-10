import { useMemo } from "react";
import { Page } from "../components/Page.tsx";
import {
  formatRunnerLifecycleStatus,
  formatTimestamp,
  normalizeRunnerConnectionState,
} from "../utils/formatting.ts";
import { normalizeRunnerAvailableAgentSdks, normalizeRunnerCodexAvailableModels } from "../utils/normalization.ts";
import { DEFAULT_AGENT_SDK } from "../utils/constants.ts";
import { getChatsPath, setBrowserPath } from "../utils/path.ts";
import { buildRunnerStartCommand } from "../utils/shell.ts";

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
}: any) {
  const connectionState = normalizeRunnerConnectionState(runner.isConnected);
  const runnerStatus = formatRunnerLifecycleStatus(runner.status);
  const runnerSecret = runnerSecretsById[runner.id] || "";
  const availableAgentSdks = normalizeRunnerAvailableAgentSdks(runner);
  const availableSdkNames = availableAgentSdks.map((entry: any) => entry.name);
  const codexAvailableModels = normalizeRunnerCodexAvailableModels(runner);
  const isBusy = deletingRunnerId === runner.id || regeneratingRunnerId === runner.id;

  const assignedAgents = useMemo(() => {
    return agents.filter((agent: any) => agent.agentRunnerId === runner.id);
  }, [agents, runner.id]);

  const runnerCommand = useMemo(() => {
    const secret = runnerSecret || "<RUNNER_SECRET>";
    return buildRunnerStartCommand({ runnerSecret: secret });
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
          <p className="stat-label">Status</p>
          <p className="stat-value">{runnerStatus}</p>
          <p className="stat-footnote">runner lifecycle</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Agents</p>
          <p className="stat-value">{assignedAgents.length}</p>
          <p className="stat-footnote">assigned to this runner</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Models</p>
          <p className="stat-value">{codexAvailableModels.length}</p>
          <p className="stat-footnote">available</p>
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
                  title={reasoningLabel ? `${entry.name} (${reasoningLabel})` : entry.name}
                >
                  <span className="runner-model-name">{entry.name}</span>
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
            <span className="chat-settings-label">Runner status</span>
            <p className="chat-settings-readonly">{runnerStatus}</p>
          </div>

          <div className="chat-settings-field">
            <span className="chat-settings-label">SDK catalog</span>
            <p className="chat-settings-readonly">
              {availableSdkNames.length > 0 ? availableSdkNames.join(", ") : "none reported"}
            </p>
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
              autoComplete="off"
              spellCheck={false}
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
