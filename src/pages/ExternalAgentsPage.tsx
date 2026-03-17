import { useMemo, useState, type ChangeEvent, type FormEvent, type KeyboardEvent, type MouseEvent } from "react";
import { CreationModal } from "../components/CreationModal.tsx";
import { Page } from "../components/Page.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import { setBrowserPath } from "../utils/path.ts";
import type { ExternalAgent } from "../types/domain.ts";

interface ExternalAgentsPageProps {
  externalAgents: ExternalAgent[];
  isLoadingExternalAgents: boolean;
  externalAgentError: string;
  isCreatingExternalAgent: boolean;
  externalAgentNameDraft: string;
  deletingExternalAgentId: string | null;
  externalAgentCountLabel: string;
  onExternalAgentNameChange: (nextName: string) => void;
  onCreateExternalAgent: (event: FormEvent<HTMLFormElement>) => Promise<boolean> | boolean;
  onDeleteExternalAgent: (externalAgentId: string) => void;
}

export function ExternalAgentsPage({
  externalAgents,
  isLoadingExternalAgents,
  externalAgentError,
  isCreatingExternalAgent,
  externalAgentNameDraft,
  deletingExternalAgentId,
  externalAgentCountLabel,
  onExternalAgentNameChange,
  onCreateExternalAgent,
  onDeleteExternalAgent,
}: ExternalAgentsPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  async function handleCreateExternalAgentSubmit(event: FormEvent<HTMLFormElement>) {
    const didCreate = await onCreateExternalAgent(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
    }
  }

  const pageActions = useMemo(() => (
    <>
      <span className="chat-card-meta">{externalAgentCountLabel}</span>
      <button
        type="button"
        className="chat-minimal-header-icon-btn"
        aria-label="Create external agent"
        title="Create external agent"
        onClick={() => setIsCreateModalOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </>
  ), [externalAgentCountLabel]);
  useSetPageActions(pageActions);

  return (
    <Page><div className="page-stack">
      <section className="dashboard-grid">
        <article className="panel stat-panel">
          <p className="stat-label">Registered</p>
          <p className="stat-value">{externalAgents.length}</p>
          <p className="stat-footnote">{externalAgentCountLabel}</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Actor-linked</p>
          <p className="stat-value">{externalAgents.filter((entry) => entry.actorId).length}</p>
          <p className="stat-footnote">ready for task ownership</p>
        </article>
      </section>

      <section className="panel list-panel">
        {externalAgentError ? <p className="error-banner">{externalAgentError}</p> : null}
        {isLoadingExternalAgents ? <p className="empty-hint">Loading external agents...</p> : null}
        {!isLoadingExternalAgents && externalAgents.length === 0 ? (
          <div className="empty-state">
            <p className="empty-hint">No external agents registered yet.</p>
            <button
              type="button"
              className="secondary-btn empty-create-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Create external agent
            </button>
          </div>
        ) : null}

        {externalAgents.length > 0 ? (
          <ul className="chat-card-list">
            {externalAgents.map((externalAgent) => {
              const isBusy = deletingExternalAgentId === externalAgent.id;
              return (
                <li
                  key={externalAgent.id}
                  className="chat-card"
                  onClick={() => !isBusy && setBrowserPath(`/external_agents/${externalAgent.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => {
                    if (event.key === "Enter" && !isBusy) {
                      setBrowserPath(`/external_agents/${externalAgent.id}`);
                    }
                  }}
                >
                  <div className="chat-card-main">
                    <p className="chat-card-title">
                      <strong>{externalAgent.name || "Unnamed external agent"}</strong>
                    </p>
                    <p className="chat-card-meta">Actor {externalAgent.actorId || "pending"}</p>
                  </div>
                  <div className="chat-card-actions">
                    <button
                      type="button"
                      className="chat-card-icon-btn chat-card-icon-btn-danger"
                      onClick={(event: MouseEvent<HTMLButtonElement>) => {
                        event.stopPropagation();
                        onDeleteExternalAgent(externalAgent.id);
                      }}
                      disabled={isBusy}
                      aria-label={isBusy ? "Deleting..." : "Delete external agent"}
                      title={isBusy ? "Deleting..." : "Delete external agent"}
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
        modalId="create-external-agent-modal"
        title="Create external agent"
        description="Register an external system that will call the agent API."
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <form className="task-form" onSubmit={handleCreateExternalAgentSubmit}>
          <label htmlFor="external-agent-name">External agent name</label>
          <input
            id="external-agent-name"
            name="externalAgentName"
            placeholder="Example: ERP bridge"
            value={externalAgentNameDraft}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onExternalAgentNameChange(event.target.value)}
            autoFocus
            required
          />

          <button type="submit" disabled={isCreatingExternalAgent}>
            {isCreatingExternalAgent ? "Creating..." : "Create external agent"}
          </button>
        </form>
      </CreationModal>
    </div></Page>
  );
}
