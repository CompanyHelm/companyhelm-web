import { useMemo, useState } from "react";
import { Page } from "../components/Page.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import { OrgGraphView } from "../components/OrgGraphView.tsx";
import { OrgTableView } from "../components/OrgTableView.tsx";
import type { Actor, ReporteeRelation } from "../types/domain.ts";

type OrgTab = "table" | "graph";

interface OrgPageProps {
  actors: Actor[];
  reportees: ReporteeRelation[];
  isLoading: boolean;
  error: string;
}

export function OrgPage({ actors, reportees, isLoading, error }: OrgPageProps) {
  const [activeTab, setActiveTab] = useState<OrgTab>("table");
  const actorCountLabel = useMemo(() => {
    const count = Array.isArray(actors) ? actors.length : 0;
    if (count === 0) {
      return "No actors";
    }
    if (count === 1) {
      return "1 actor";
    }
    return `${count} actors`;
  }, [actors]);

  useSetPageActions(null);

  return (
    <Page className="org-page">
      <section className="page-panel org-page-panel">
        <header className="org-page-header">
          <div>
            <p className="eyebrow">Org</p>
            <h1>Org</h1>
            <p className="subcopy">Browse actor reporting structure across users and agents.</p>
          </div>
          <div className="count-chip">{actorCountLabel}</div>
        </header>

        <div className="task-view-tabs org-view-tabs" role="tablist" aria-label="Org views">
          <button
            type="button"
            className={`task-view-tab${activeTab === "table" ? " task-view-tab-active" : ""}`}
            onClick={() => setActiveTab("table")}
          >
            Table
          </button>
          <button
            type="button"
            className={`task-view-tab${activeTab === "graph" ? " task-view-tab-active" : ""}`}
            onClick={() => setActiveTab("graph")}
          >
            Graph
          </button>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}
        {isLoading ? (
          <p className="empty-hint">Loading org structure…</p>
        ) : activeTab === "graph" ? (
          <OrgGraphView actors={actors} reportees={reportees} />
        ) : (
          <OrgTableView actors={actors} reportees={reportees} />
        )}
      </section>
    </Page>
  );
}
