import { useMemo, useState } from "react";
import { CreationModal } from "../components/CreationModal.jsx";
import { formatTimestamp, normalizeRunnerStatus, toSortableTimestamp } from "../utils/formatting.js";
import { normalizeRunnerAvailableAgentSdks, normalizeRunnerCodexAvailableModels } from "../utils/normalization.js";
import { DEFAULT_AGENT_SDK } from "../utils/constants.js";

function quoteShellArg(value) {
  const normalizedValue = String(value ?? "");
  if (/^[A-Za-z0-9_./:-]+$/.test(normalizedValue)) {
    return normalizedValue;
  }
  return `'${normalizedValue.replace(/'/g, `'\"'\"'`)}'`;
}

function buildRunnerStartCommand({
  backendGrpcTarget,
  runnerSecret,
}) {
  return [
    "companyhelm",
    "--server-url",
    quoteShellArg(backendGrpcTarget),
    "--secret",
    quoteShellArg(runnerSecret),
  ].join(" ");
}

export function AgentRunnerPage({
  selectedCompanyId,
  agentRunners,
  isLoadingRunners,
  runnerError,
  isCreatingRunner,
  runnerNameDraft,
  runnerGrpcTarget,
  runnerSecretsById,
  regeneratingRunnerId,
  deletingRunnerId,
  runnerCountLabel,
  onRunnerNameChange,
  onRunnerCommandSecretChange,
  onCreateRunner,
  onRegenerateRunnerSecret,
  onDeleteRunner,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailsRunnerId, setDetailsRunnerId] = useState("");

  const detailsRunner = agentRunners.find((r) => r.id === detailsRunnerId) || null;

  const readyRunnerCount = useMemo(() => {
    return agentRunners.filter((runner) => normalizeRunnerStatus(runner.status) === "ready")
      .length;
  }, [agentRunners]);

  const disconnectedRunnerCount = useMemo(() => {
    return agentRunners.length - readyRunnerCount;
  }, [agentRunners.length, readyRunnerCount]);

  async function handleCreateRunnerSubmit(event) {
    const didCreate = await onCreateRunner(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
    }
  }

  return (
    <div className="page-stack">
      <header className="chat-minimal-header">
        <div className="chat-minimal-header-info">
          <p className="chat-minimal-header-agent">{selectedCompanyId}</p>
          <h1 className="chat-minimal-header-title">Runners</h1>
        </div>
        <div className="chat-minimal-header-actions">
          <span className="chat-card-meta">{runnerCountLabel}</span>
          <button
            type="button"
            className="chat-minimal-header-icon-btn"
            aria-label="Register runner"
            title="Register runner"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <section className="dashboard-grid">
        <article className="panel stat-panel">
          <p className="stat-label">Registered</p>
          <p className="stat-value">{agentRunners.length}</p>
          <p className="stat-footnote">{runnerCountLabel}</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Ready</p>
          <p className="stat-value">{readyRunnerCount}</p>
          <p className="stat-footnote">connected</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Disconnected</p>
          <p className="stat-value">{disconnectedRunnerCount}</p>
          <p className="stat-footnote">attention needed</p>
        </article>
      </section>

      <section className="panel list-panel">

        {runnerError ? <p className="error-banner">{runnerError}</p> : null}
        {isLoadingRunners ? <p className="empty-hint">Loading runners...</p> : null}
        {!isLoadingRunners && agentRunners.length === 0 ? (
          <div className="empty-state">
            <p className="empty-hint">No agent runners registered yet.</p>
            <button
              type="button"
              className="secondary-btn empty-create-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Create runner
            </button>
          </div>
        ) : null}

        {agentRunners.length > 0 ? (
          <ul className="chat-card-list">
            {[...agentRunners]
              .sort((a, b) => toSortableTimestamp(b.lastSeenAt) - toSortableTimestamp(a.lastSeenAt))
              .map((runner) => {
                const runnerStatus = normalizeRunnerStatus(runner.status);
                const isBusy =
                  deletingRunnerId === runner.id || regeneratingRunnerId === runner.id;

                return (
                  <li
                    key={runner.id}
                    className="chat-card"
                    onClick={() => !isBusy && setDetailsRunnerId(runner.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !isBusy) {
                        setDetailsRunnerId(runner.id);
                      }
                    }}
                  >
                    <div className="chat-card-main">
                      <p className="chat-card-title">
                        <strong>{runner.name || "Unnamed runner"}</strong>
                        {" "}
                        <span className={`runner-status runner-status-${runnerStatus}`}>
                          {runnerStatus}
                        </span>
                      </p>
                      <p className="chat-card-meta">
                        {runner.id} &middot; Last seen {formatTimestamp(runner.lastSeenAt)}
                      </p>
                    </div>
                    <div className="chat-card-actions">
                      <button
                        type="button"
                        className="chat-card-icon-btn chat-card-icon-btn-danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteRunner(runner.id);
                        }}
                        disabled={isBusy}
                        aria-label={deletingRunnerId === runner.id ? "Deleting..." : "Delete runner"}
                        title={deletingRunnerId === runner.id ? "Deleting..." : "Delete runner"}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
          </ul>
        ) : null}
      </section>

      <CreationModal
        modalId="create-runner-modal"
        title="Create agent runner"
        description="Register a new runner endpoint for this company."
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <form className="task-form" onSubmit={handleCreateRunnerSubmit}>
          <label htmlFor="runner-name">Runner name</label>
          <input
            id="runner-name"
            name="runnerName"
            placeholder="Example: Production runner"
            value={runnerNameDraft}
            onChange={(event) => onRunnerNameChange(event.target.value)}
            autoFocus
            required
          />

          <button type="submit" disabled={isCreatingRunner}>
            {isCreatingRunner ? "Creating..." : "Create runner"}
          </button>
        </form>
      </CreationModal>

      <CreationModal
        modalId="runner-details-modal"
        title={detailsRunner ? (detailsRunner.name || "Unnamed runner") : "Runner details"}
        description=""
        isOpen={Boolean(detailsRunnerId)}
        onClose={() => setDetailsRunnerId("")}
        cardClassName="modal-card-wide"
      >
        {detailsRunner ? (() => {
          const runnerStatus = normalizeRunnerStatus(detailsRunner.status);
          const runnerSecret = runnerSecretsById[detailsRunner.id] || "";
          const availableAgentSdks = normalizeRunnerAvailableAgentSdks(detailsRunner);
          const availableSdkNames = availableAgentSdks.map((entry) => entry.name);
          const codexAvailableModels = normalizeRunnerCodexAvailableModels(detailsRunner);
          const isBusy =
            deletingRunnerId === detailsRunner.id || regeneratingRunnerId === detailsRunner.id;
          const runnerCommand = buildRunnerStartCommand({
            backendGrpcTarget: runnerGrpcTarget,
            runnerSecret: runnerSecret || "<RUNNER_SECRET>",
          });

          const renderModelPill = (entry, index) => {
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
          };

          return (
            <div className="chat-settings-modal-form">
              <div className="chat-settings-field">
                <span className="chat-settings-label">Runner ID</span>
                <p className="chat-settings-readonly">{detailsRunner.id}</p>
              </div>

              <div className="chat-settings-field">
                <span className="chat-settings-label">Status</span>
                <p className="chat-settings-readonly">
                  <span className={`runner-status runner-status-${runnerStatus}`}>
                    {runnerStatus}
                  </span>
                </p>
              </div>

              <div className="chat-settings-field">
                <span className="chat-settings-label">gRPC target</span>
                <p className="chat-settings-readonly">{runnerGrpcTarget || "-"}</p>
              </div>

              <div className="chat-settings-field">
                <span className="chat-settings-label">Last seen</span>
                <p className="chat-settings-readonly">{formatTimestamp(detailsRunner.lastSeenAt)}</p>
              </div>

              <div className="chat-settings-field">
                <span className="chat-settings-label">Last health check</span>
                <p className="chat-settings-readonly">{formatTimestamp(detailsRunner.lastHealthCheckAt)}</p>
              </div>

              <div className="chat-settings-field">
                <span className="chat-settings-label">CLI command</span>
                <pre className="runner-command runner-command-inline">
                  <code>{runnerCommand}</code>
                </pre>
              </div>

              <div className="chat-settings-field">
                <label htmlFor={`details-runner-secret-${detailsRunner.id}`} className="chat-settings-label">
                  Runner secret
                </label>
                <input
                  id={`details-runner-secret-${detailsRunner.id}`}
                  className="chat-settings-input"
                  type="text"
                  value={runnerSecret}
                  onChange={(event) =>
                    onRunnerCommandSecretChange(detailsRunner.id, event.target.value)
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
                  onClick={() => onRegenerateRunnerSecret(detailsRunner.id)}
                  disabled={isBusy}
                  style={{ marginTop: "0.5rem" }}
                >
                  {regeneratingRunnerId === detailsRunner.id ? "Regenerating..." : "Regenerate key"}
                </button>
              </div>

              <div className="chat-settings-field">
                <span className="chat-settings-label">SDK catalog</span>
                <p className="chat-settings-readonly">
                  {availableSdkNames.length > 0 ? availableSdkNames.join(", ") : "none reported"}
                </p>
              </div>

              <div className="chat-settings-field">
                <span className="chat-settings-label">{DEFAULT_AGENT_SDK} models</span>
                {codexAvailableModels.length === 0 ? (
                  <p className="chat-settings-readonly">none reported yet</p>
                ) : (
                  <div className="runner-models-list">
                    {codexAvailableModels.map((entry, index) => renderModelPill(entry, index))}
                  </div>
                )}
              </div>

              <div className="chat-settings-actions">
                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => {
                    onDeleteRunner(detailsRunner.id);
                    setDetailsRunnerId("");
                  }}
                  disabled={isBusy}
                >
                  {deletingRunnerId === detailsRunner.id ? "Deleting..." : "Delete runner"}
                </button>
              </div>
            </div>
          );
        })() : null}
      </CreationModal>
    </div>
  );
}
