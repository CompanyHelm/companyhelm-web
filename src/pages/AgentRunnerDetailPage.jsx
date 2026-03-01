import { useMemo } from "react";
import { Page } from "../components/Page.jsx";
import { formatTimestamp, normalizeRunnerStatus } from "../utils/formatting.js";
import { normalizeRunnerAvailableAgentSdks, normalizeRunnerCodexAvailableModels } from "../utils/normalization.js";
import { DEFAULT_AGENT_SDK } from "../utils/constants.js";
import { setBrowserPath } from "../utils/path.js";

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
}) {
  const runnerStatus = normalizeRunnerStatus(runner.status);
  const runnerSecret = runnerSecretsById[runner.id] || "";
  const availableAgentSdks = normalizeRunnerAvailableAgentSdks(runner);
  const availableSdkNames = availableAgentSdks.map((entry) => entry.name);
  const codexAvailableModels = normalizeRunnerCodexAvailableModels(runner);
  const isBusy = deletingRunnerId === runner.id || regeneratingRunnerId === runner.id;

  const assignedAgents = useMemo(() => {
    return agents.filter((agent) => agent.agentRunnerId === runner.id);
  }, [agents, runner.id]);

  const runnerCommand = useMemo(() => {
    const secret = runnerSecret || "<RUNNER_SECRET>";
    const target = runnerGrpcTarget || "<GRPC_TARGET>";
    return `companyhelm --server-url ${target} --secret ${secret}`;
  }, [runnerGrpcTarget, runnerSecret]);

  return (
    <Page><div className="page-stack">
      <section className="dashboard-grid">
        <article className="panel stat-panel">
          <p className="stat-label">Status</p>
          <p className="stat-value">
            <span className={`runner-status runner-status-${runnerStatus}`}>
              {runnerStatus}
            </span>
          </p>
          <p className="stat-footnote">Last seen {formatTimestamp(runner.lastSeenAt)}</p>
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
            {assignedAgents.map((agent) => {
              const modelLabel = String(agent.model || "").trim() || "n/a";
              return (
                <li
                  key={agent.id}
                  className="chat-card"
                  onClick={() => setBrowserPath(`/agents/${agent.id}/chats`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      setBrowserPath(`/agents/${agent.id}/chats`);
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
            {codexAvailableModels.map((entry, index) => {
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
                      {entry.reasoning.map((level, reasonIndex) => (
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
              onChange={(event) =>
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
