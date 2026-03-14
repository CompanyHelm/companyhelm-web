import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Page } from "../components/Page.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import type { Actor, ReporteeRelation } from "../types/domain.ts";
import { buildActorDescendantRows } from "../utils/actor-hierarchy.ts";

type ActorTab = "overview" | "reportees";

interface ActorPageProps {
  actor: Actor | null;
  actors: Actor[];
  reportees: ReporteeRelation[];
  isSaving: boolean;
  error: string;
  onSaveDescription: (description: string) => void | Promise<void>;
  onOpenActor?: (actorId: string) => void;
}

function getActorKindLabel(kind: Actor["kind"]) {
  return kind === "user" ? "Human" : "AI";
}

export function ActorPage({
  actor,
  actors,
  reportees,
  isSaving,
  error,
  onSaveDescription,
  onOpenActor,
}: ActorPageProps) {
  const [activeTab, setActiveTab] = useState<ActorTab>("overview");
  const [draftDescription, setDraftDescription] = useState(() => String(actor?.description || ""));

  useEffect(() => {
    setDraftDescription(String(actor?.description || ""));
  }, [actor?.description, actor?.id]);

  useSetPageActions(null);

  const descendantRows = useMemo(() => buildActorDescendantRows({
    actorId: String(actor?.id || ""),
    actors,
    reportees,
  }), [actor?.id, actors, reportees]);
  const actorById = useMemo(
    () => new Map((Array.isArray(actors) ? actors : []).map((entry) => [String(entry.id || "").trim(), entry] as const)),
    [actors],
  );

  if (!actor) {
    return (
      <Page className="org-page">
        <section className="page-panel org-page-panel">
          <header className="org-page-header">
            <div>
              <p className="eyebrow">Org</p>
              <h1>Actor Not Found</h1>
              <p className="subcopy">The requested actor is not available in this company.</p>
            </div>
          </header>
        </section>
      </Page>
    );
  }

  return (
    <Page className="org-page actor-page">
      <section className="page-panel org-page-panel actor-page-panel">
        <header className="org-page-header actor-page-header">
          <div>
            <p className="eyebrow">Org</p>
            <h1>{actor.displayName}</h1>
            <p className="subcopy">Persona and reporting structure for this actor.</p>
          </div>
          <div className="count-chip">{getActorKindLabel(actor.kind)}</div>
        </header>

        <div className="task-view-tabs org-view-tabs" role="tablist" aria-label="Actor views">
          <button
            type="button"
            className={`task-view-tab${activeTab === "overview" ? " task-view-tab-active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            className={`task-view-tab${activeTab === "reportees" ? " task-view-tab-active" : ""}`}
            onClick={() => setActiveTab("reportees")}
          >
            Reportees
          </button>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}

        {activeTab === "reportees" ? (
          descendantRows.length === 0 ? (
            <div className="task-empty-panel">
              <p className="empty-hint">No reportees for this actor yet.</p>
            </div>
          ) : (
            <div className="org-table-shell">
              <table className="org-table">
                <thead>
                  <tr>
                    <th>Actor</th>
                    <th>Type</th>
                    <th>Manager</th>
                    <th>Reports</th>
                  </tr>
                </thead>
                <tbody>
                  {descendantRows.map((row) => (
                    <tr key={row.actor.id}>
                      <td>
                        <div
                          className="org-actor-cell"
                          style={{ paddingLeft: `${row.depth * 1.1 + 0.85}rem` }}
                        >
                          <span className="org-tree-marker" aria-hidden="true">↳</span>
                          {onOpenActor ? (
                            <button
                              type="button"
                              className="org-actor-link"
                              onClick={() => onOpenActor(row.actor.id)}
                            >
                              {row.actor.displayName}
                            </button>
                          ) : (
                            <span>{row.actor.displayName}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`org-kind-pill org-kind-pill-${row.actor.kind}`}>
                          {getActorKindLabel(row.actor.kind)}
                        </span>
                      </td>
                      <td>{row.managerActorId ? (actorById.get(row.managerActorId)?.displayName || row.managerActorId) : "Root"}</td>
                      <td>{row.reportCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="actor-overview-grid">
            <section className="actor-overview-card">
              <div className="actor-meta-list">
                <div>
                  <span className="actor-meta-label">Type</span>
                  <strong>{getActorKindLabel(actor.kind)}</strong>
                </div>
                <div>
                  <span className="actor-meta-label">Actor ID</span>
                  <strong>{actor.id}</strong>
                </div>
              </div>
              <label className="actor-description-label" htmlFor="actor-description">
                Persona overview
              </label>
              <textarea
                id="actor-description"
                className="chat-settings-input chat-settings-textarea actor-description-textarea"
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                placeholder="Describe how this actor behaves, what it owns, and how others should work with it."
              />
              <div className="actor-overview-actions">
                <button
                  type="button"
                  className="primary-button"
                  disabled={isSaving}
                  onClick={() => void onSaveDescription(draftDescription)}
                >
                  {isSaving ? "Saving..." : "Save Overview"}
                </button>
              </div>
            </section>
            <section className="actor-overview-card actor-markdown-preview">
              <p className="eyebrow">Preview</p>
              {draftDescription.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {draftDescription}
                </ReactMarkdown>
              ) : (
                <p className="empty-hint">No description yet.</p>
              )}
            </section>
          </div>
        )}
      </section>
    </Page>
  );
}
