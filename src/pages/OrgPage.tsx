import { useState } from "react";
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
  onOpenActor?: (actorId: string) => void;
}

export function OrgPage({ actors, reportees, isLoading, error, onOpenActor }: OrgPageProps) {
  const [activeTab, setActiveTab] = useState<OrgTab>("table");

  useSetPageActions(null);

  return (
    <Page className="page-container-full">
      <div className="task-page-stack">
        <section className="panel task-detail-panel org-page-panel">
          <div className="task-view-tabs org-view-tabs" role="tablist" aria-label="Organization views">
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
            <div className="task-empty-panel">
              <p className="empty-hint">Loading organization structure...</p>
            </div>
          ) : activeTab === "graph" ? (
            <OrgGraphView actors={actors} reportees={reportees} onOpenActor={onOpenActor} />
          ) : (
            <OrgTableView actors={actors} reportees={reportees} onOpenActor={onOpenActor} />
          )}
        </section>
      </div>
    </Page>
  );
}
