import { useMemo, useState } from "react";
import { Page } from "../components/Page.tsx";
import { CreationModal } from "../components/CreationModal.tsx";
import { formatTimestamp, normalizeRunnerStatus, toSortableTimestamp } from "../utils/formatting.ts";
import { setBrowserPath } from "../utils/path.ts";
import { useSetPageActions } from "../components/PageActionsContext.tsx";

export function AgentRunnerPage({
  selectedCompanyId,
  agentRunners,
  isLoadingRunners,
  runnerError,
  isCreatingRunner,
  runnerNameDraft,
  regeneratingRunnerId,
  deletingRunnerId,
  runnerCountLabel,
  onRunnerNameChange,
  onCreateRunner,
  onDeleteRunner,
}: any) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<any>(false);

  const readyRunnerCount = useMemo(() => {
    return agentRunners.filter((runner: any) => normalizeRunnerStatus(runner.status) === "ready")
      .length;
  }, [agentRunners]);

  const disconnectedRunnerCount = useMemo(() => {
    return agentRunners.length - readyRunnerCount;
  }, [agentRunners.length, readyRunnerCount]);

  async function handleCreateRunnerSubmit(event: any) {
    const didCreate = await onCreateRunner(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
    }
  }

  const pageActions = useMemo(() => (
    <>
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
    </>
  ), [runnerCountLabel]);
  useSetPageActions(pageActions);

  return (
    <Page><div className="page-stack">
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
              .sort((a: any, b: any) => toSortableTimestamp(b.lastSeenAt) - toSortableTimestamp(a.lastSeenAt))
              .map((runner: any) => {
                const runnerStatus = normalizeRunnerStatus(runner.status);
                const isBusy =
                  deletingRunnerId === runner.id || regeneratingRunnerId === runner.id;

                return (
                  <li
                    key={runner.id}
                    className="chat-card"
                    onClick={() => !isBusy && setBrowserPath(`/agent-runner/${runner.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event: any) => {
                      if (event.key === "Enter" && !isBusy) {
                        setBrowserPath(`/agent-runner/${runner.id}`);
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
                        onClick={(event: any) => {
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
            onChange={(event: any) => onRunnerNameChange(event.target.value)}
            autoFocus
            required
          />

          <button type="submit" disabled={isCreatingRunner}>
            {isCreatingRunner ? "Creating..." : "Create runner"}
          </button>
        </form>
      </CreationModal>

    </div></Page>
  );
}
