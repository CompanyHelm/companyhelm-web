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
      <section className="panel hero-panel">
        <p className="eyebrow">Infrastructure</p>
        <h1>Agent runner page</h1>
        <p className="subcopy">
          Track runner status signals and heartbeat timestamps.
        </p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
      </section>

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

      <section className="panel runner-panel">
        <header className="panel-header panel-header-row">
          <h2>Agent runners</h2>
          <div className="task-meta">
            <button
              type="button"
              className="icon-create-btn"
              aria-label="Create agent runner"
              title="Create agent runner"
              onClick={() => setIsCreateModalOpen(true)}
            >
              +
            </button>
          </div>
        </header>

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
          <ul className="runner-list">
            {[...agentRunners]
              .sort((a, b) => toSortableTimestamp(b.lastSeenAt) - toSortableTimestamp(a.lastSeenAt))
              .map((runner) => {
                const runnerStatus = normalizeRunnerStatus(runner.status);
                const runnerSecret = runnerSecretsById[runner.id] || "";
                const availableAgentSdks = normalizeRunnerAvailableAgentSdks(runner);
                const availableSdkNames = availableAgentSdks.map((entry) => entry.name);
                const codexAvailableModels = normalizeRunnerCodexAvailableModels(runner);
                const codexAvailableModelsPreview = codexAvailableModels.slice(0, 4);
                const codexAvailableModelsOverflow = Math.max(
                  0,
                  codexAvailableModels.length - codexAvailableModelsPreview.length,
                );
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
                  <li key={runner.id} className="runner-card">
                    <div className="runner-card-top">
                      <div>
                        <p className="runner-card-title">{runner.name || "Unnamed runner"}</p>
                        <code className="runner-id">{runner.id}</code>
                      </div>
                      <span className={`runner-status runner-status-${runnerStatus}`}>
                        {runnerStatus}
                      </span>
                    </div>
                    <p className="runner-last-seen">
                      Last seen: <em>{formatTimestamp(runner.lastSeenAt)}</em>
                    </p>
                    <p className="runner-last-seen">
                      Last health check: <em>{formatTimestamp(runner.lastHealthCheckAt)}</em>
                    </p>
                    <section className="runner-codex-section">
                      <h3 className="runner-section-title">SDK catalog</h3>
                      <p className="runner-last-seen">
                        Available SDKs:{" "}
                        <strong>{availableSdkNames.length > 0 ? availableSdkNames.join(", ") : "none reported"}</strong>
                      </p>
                      <div className="runner-last-seen runner-models-row">
                        <span className="runner-models-label">{DEFAULT_AGENT_SDK} models:</span>
                        {codexAvailableModels.length === 0 ? (
                          <em className="runner-models-empty">none reported yet</em>
                        ) : codexAvailableModelsOverflow === 0 ? (
                          <span className="runner-models-list">
                            {codexAvailableModelsPreview.map((entry, index) =>
                              renderModelPill(entry, index),
                            )}
                          </span>
                        ) : (
                          <details className="runner-models-details">
                            <summary className="runner-models-summary">
                              <span className="runner-models-list">
                                {codexAvailableModelsPreview.map((entry, index) =>
                                  renderModelPill(entry, index),
                                )}
                                <span className="runner-model-pill runner-model-pill-more">
                                  +{codexAvailableModelsOverflow} more
                                </span>
                              </span>
                            </summary>
                            <div className="runner-models-expanded">
                              <span className="runner-models-list">
                                {codexAvailableModels.map((entry, index) =>
                                  renderModelPill(entry, index),
                                )}
                              </span>
                            </div>
                          </details>
                        )}
                      </div>
                    </section>
                    <div className="runner-cli-block">
                      <label
                        className="relationship-field"
                        htmlFor={`runner-secret-command-${runner.id}`}
                      >
                        Runner secret for CLI
                      </label>
                      <input
                        id={`runner-secret-command-${runner.id}`}
                        className="runner-secret-input"
                        type="text"
                        value={runnerSecret}
                        onChange={(event) =>
                          onRunnerCommandSecretChange(runner.id, event.target.value)
                        }
                        placeholder="Paste runner secret to complete command"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <pre className="runner-command runner-command-inline">
                        <code>{runnerCommand}</code>
                      </pre>
                      {!runnerSecret ? (
                        <p className="runner-command-hint">
                          Secret is only shown at provisioning time. Paste it here to run this
                          command.
                        </p>
                      ) : null}
                    </div>
                    <div className="runner-card-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => onRegenerateRunnerSecret(runner.id)}
                        disabled={
                          deletingRunnerId === runner.id || regeneratingRunnerId === runner.id
                        }
                      >
                        {regeneratingRunnerId === runner.id ? "Regenerating..." : "Regenerate key"}
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => onDeleteRunner(runner.id)}
                        disabled={
                          deletingRunnerId === runner.id || regeneratingRunnerId === runner.id
                        }
                      >
                        {deletingRunnerId === runner.id ? "Deleting..." : "Delete runner"}
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
    </div>
  );
}
