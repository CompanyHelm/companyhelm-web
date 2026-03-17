import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ActorKindBadge } from "../components/ActorKindBadge.tsx";
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
  isAddingReportee?: boolean;
  error: string;
  activeTab?: ActorTab;
  onSaveDescription: (description: string) => void | Promise<void>;
  onAddReportee?: (reporteeActorId: string) => Promise<boolean> | boolean;
  onTabChange?: (tab: ActorTab) => void;
  onOpenActor?: (actorId: string) => void;
}

function compareActors(left: Actor, right: Actor) {
  const leftName = String(left?.displayName || "").trim();
  const rightName = String(right?.displayName || "").trim();
  const byName = leftName.localeCompare(rightName);
  if (byName !== 0) {
    return byName;
  }
  return String(left?.id || "").localeCompare(String(right?.id || ""));
}

export function ActorPage({
  actor,
  actors,
  reportees,
  isSaving,
  isAddingReportee = false,
  error,
  activeTab = "overview",
  onSaveDescription,
  onAddReportee,
  onTabChange,
  onOpenActor,
}: ActorPageProps) {
  const [selectedTab, setSelectedTab] = useState<ActorTab>(activeTab);
  const [draftDescription, setDraftDescription] = useState(() => String(actor?.description || ""));
  const [selectedReporteeActorId, setSelectedReporteeActorId] = useState("");

  useEffect(() => {
    setDraftDescription(String(actor?.description || ""));
  }, [actor?.description, actor?.id]);

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    setSelectedReporteeActorId("");
  }, [actor?.id]);

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
  const managerActorIdByReporteeId = useMemo(() => {
    const map = new Map<string, string>();
    for (const relation of Array.isArray(reportees) ? reportees : []) {
      const reporteeActorId = String(relation?.reporteeActorId || "").trim();
      const managerActorId = String(relation?.managerActorId || "").trim();
      if (!reporteeActorId || !managerActorId || reporteeActorId === managerActorId) {
        continue;
      }
      map.set(reporteeActorId, managerActorId);
    }
    return map;
  }, [reportees]);
  const descendantActorIds = useMemo(
    () => new Set(descendantRows.map((row) => String(row.actor.id || "").trim()).filter(Boolean)),
    [descendantRows],
  );
  const ancestorActorIds = useMemo(() => {
    const resolvedActorId = String(actor?.id || "").trim();
    const ids = new Set<string>();
    const visited = new Set<string>();
    let currentActorId = resolvedActorId;

    while (currentActorId && !visited.has(currentActorId)) {
      visited.add(currentActorId);
      const managerActorId = managerActorIdByReporteeId.get(currentActorId);
      if (!managerActorId) {
        break;
      }
      ids.add(managerActorId);
      currentActorId = managerActorId;
    }

    return ids;
  }, [actor?.id, managerActorIdByReporteeId]);
  const availableReporteeActors = useMemo(() => {
    const resolvedActorId = String(actor?.id || "").trim();
    return (Array.isArray(actors) ? actors : [])
      .filter((entry) => {
        const candidateId = String(entry?.id || "").trim();
        return Boolean(candidateId)
          && candidateId !== resolvedActorId
          && !descendantActorIds.has(candidateId)
          && !ancestorActorIds.has(candidateId);
      })
      .sort(compareActors);
  }, [actor?.id, actors, ancestorActorIds, descendantActorIds]);

  const handleAddReportee = async () => {
    const resolvedReporteeActorId = String(selectedReporteeActorId || "").trim();
    if (!resolvedReporteeActorId || !onAddReportee) {
      return;
    }
    const didAddReportee = await onAddReportee(resolvedReporteeActorId);
    if (didAddReportee) {
      setSelectedReporteeActorId("");
    }
  };

  function handleSelectTab(tab: ActorTab) {
    setSelectedTab(tab);
    onTabChange?.(tab);
  }

  if (!actor) {
    return (
      <Page className="org-page">
        <section className="page-panel org-page-panel">
          <header className="org-page-header">
            <div>
              <p className="eyebrow">Organization</p>
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
            <p className="eyebrow">Organization</p>
            <h1>{actor.displayName}</h1>
            <p className="subcopy">Persona and reporting structure for this actor.</p>
          </div>
          <ActorKindBadge kind={actor.kind} className="actor-kind-badge-hero" />
        </header>

        <div className="task-view-tabs org-view-tabs" role="tablist" aria-label="Actor views">
          <button
            type="button"
            className={`task-view-tab${selectedTab === "overview" ? " task-view-tab-active" : ""}`}
            onClick={() => handleSelectTab("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            className={`task-view-tab${selectedTab === "reportees" ? " task-view-tab-active" : ""}`}
            onClick={() => handleSelectTab("reportees")}
          >
            Reportees
          </button>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}

        {selectedTab === "reportees" ? (
          <div className="actor-reportees-stack">
            <section className="actor-overview-card actor-reportee-manager-card">
              <div>
                <p className="eyebrow">Reportees</p>
                <p className="subcopy">Assign another actor to report to {actor.displayName}.</p>
              </div>
              <div className="actor-reportee-toolbar">
                <label className="actor-reportee-label" htmlFor="actor-reportee-select">
                  Add reportee
                </label>
                <div className="actor-reportee-controls">
                  <select
                    id="actor-reportee-select"
                    className="role-detail-add-select actor-reportee-select"
                    value={selectedReporteeActorId}
                    onChange={(event) => setSelectedReporteeActorId(event.target.value)}
                    disabled={isAddingReportee || availableReporteeActors.length === 0}
                  >
                    <option value="">
                      {availableReporteeActors.length === 0 ? "No eligible actors available" : "Select an actor"}
                    </option>
                    {availableReporteeActors.map((entry) => (
                      <option key={`reportee-option-${entry.id}`} value={entry.id}>
                        {entry.displayName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={isAddingReportee || !selectedReporteeActorId}
                    onClick={() => void handleAddReportee()}
                  >
                    {isAddingReportee ? "Adding..." : "Add Reportee"}
                  </button>
                </div>
              </div>
            </section>

            {descendantRows.length === 0 ? (
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
                          <ActorKindBadge kind={row.actor.kind} />
                        </td>
                        <td>{row.managerActorId ? (actorById.get(row.managerActorId)?.displayName || row.managerActorId) : "N/A"}</td>
                        <td>{row.reportCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="actor-overview-grid">
            <section className="actor-overview-card">
              <div className="actor-meta-list">
                <div>
                  <span className="actor-meta-label">Type</span>
                  <ActorKindBadge kind={actor.kind} />
                </div>
              </div>
              <label className="actor-description-label" htmlFor="actor-description">
                Description
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
                  {isSaving ? "Saving..." : "Save Description"}
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
