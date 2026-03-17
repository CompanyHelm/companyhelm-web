import { useEffect, useState } from "react";
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
  activeTab?: OrgTab;
  onTabChange?: (tab: OrgTab) => void;
  onOpenActor?: (actorId: string) => void;
}

export function OrgPage({
  actors,
  reportees,
  isLoading,
  error,
  activeTab = "table",
  onTabChange,
  onOpenActor,
}: OrgPageProps) {
  const [selectedTab, setSelectedTab] = useState<OrgTab>(activeTab);

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  useSetPageActions(null);

  function handleSelectTab(tab: OrgTab) {
    setSelectedTab(tab);
    onTabChange?.(tab);
  }

  return (
    <Page className="page-container-full">
      <div className="task-page-stack">
        <section className="panel task-detail-panel org-page-panel">
          <div className="task-view-tabs org-view-tabs" role="tablist" aria-label="Organization views">
            <button
              type="button"
              className={`task-view-tab${selectedTab === "table" ? " task-view-tab-active" : ""}`}
              onClick={() => handleSelectTab("table")}
            >
              Table
            </button>
            <button
              type="button"
              className={`task-view-tab${selectedTab === "graph" ? " task-view-tab-active" : ""}`}
              onClick={() => handleSelectTab("graph")}
            >
              Graph
            </button>
          </div>

          {error ? <p className="error-banner">{error}</p> : null}
          {isLoading ? (
            <div className="task-empty-panel">
              <p className="empty-hint">Loading organization structure...</p>
            </div>
          ) : selectedTab === "graph" ? (
            <OrgGraphView actors={actors} reportees={reportees} onOpenActor={onOpenActor} />
          ) : (
            <OrgTableView actors={actors} reportees={reportees} onOpenActor={onOpenActor} />
          )}
        </section>
      </div>
    </Page>
  );
}
