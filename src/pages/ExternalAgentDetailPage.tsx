import { useMemo } from "react";
import { Page } from "../components/Page.tsx";
import type { ExternalAgent } from "../types/domain.ts";
import { getIgnoredSecretInputProps } from "../utils/autofill.ts";
import { resolveAgentApiDocsUrl } from "../utils/agent-api.ts";

interface ExternalAgentDetailPageProps {
  externalAgent: ExternalAgent;
  agentSecret: string;
  regeneratingExternalAgentId: string | null;
  deletingExternalAgentId: string | null;
  onAgentSecretChange: (externalAgentId: string, value: string) => void;
  onRegenerateExternalAgentSecret: (externalAgentId: string) => void;
  onDeleteExternalAgent: (externalAgentId: string) => void;
}

export function ExternalAgentDetailPage({
  externalAgent,
  agentSecret,
  regeneratingExternalAgentId,
  deletingExternalAgentId,
  onAgentSecretChange,
  onRegenerateExternalAgentSecret,
  onDeleteExternalAgent,
}: ExternalAgentDetailPageProps) {
  const isBusy = regeneratingExternalAgentId === externalAgent.id || deletingExternalAgentId === externalAgent.id;
  const docsUrl = useMemo(() => resolveAgentApiDocsUrl(), []);

  return (
    <Page><div className="page-stack">
      <section className="dashboard-grid">
        <article className="panel stat-panel">
          <p className="stat-label">External Agent</p>
          <p className="stat-value">{externalAgent.name}</p>
          <p className="stat-footnote">{externalAgent.id}</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Actor</p>
          <p className="stat-value">{externalAgent.actorId || "pending"}</p>
          <p className="stat-footnote">auto-created for task assignment</p>
        </article>
      </section>

      <section className="panel list-panel">
        <h2 className="panel-section-title">Connection</h2>
        <div className="chat-settings-modal-form">
          <div className="chat-settings-field">
            <span className="chat-settings-label">External agent ID</span>
            <p className="chat-settings-readonly">{externalAgent.id}</p>
          </div>
          <div className="chat-settings-field">
            <span className="chat-settings-label">Actor ID</span>
            <p className="chat-settings-readonly">{externalAgent.actorId || "-"}</p>
          </div>
          <div className="chat-settings-field">
            <label htmlFor={`external-agent-secret-${externalAgent.id}`} className="chat-settings-label">
              Agent secret
            </label>
            <input
              id={`external-agent-secret-${externalAgent.id}`}
              className="chat-settings-input"
              type="text"
              value={agentSecret}
              onChange={(event) => onAgentSecretChange(externalAgent.id, event.target.value)}
              placeholder="Only shown after create or rotate"
              {...getIgnoredSecretInputProps("externalAgentSecret")}
              disabled={isBusy}
            />
            {!agentSecret ? (
              <p className="chat-settings-hint">
                Secrets are only returned once during create or rotate.
              </p>
            ) : null}
          </div>
          <div className="chat-settings-actions">
            <a className="codex-auth-link" href={docsUrl} target="_blank" rel="noreferrer">
              Open Swagger UI
            </a>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => onRegenerateExternalAgentSecret(externalAgent.id)}
              disabled={isBusy}
            >
              {regeneratingExternalAgentId === externalAgent.id ? "Regenerating..." : "Rotate secret"}
            </button>
          </div>
        </div>
      </section>

      <section className="panel list-panel">
        <div className="chat-settings-actions">
          <button
            type="button"
            className="danger-btn"
            onClick={() => onDeleteExternalAgent(externalAgent.id)}
            disabled={isBusy}
          >
            {deletingExternalAgentId === externalAgent.id ? "Deleting..." : "Delete external agent"}
          </button>
        </div>
      </section>
    </div></Page>
  );
}
