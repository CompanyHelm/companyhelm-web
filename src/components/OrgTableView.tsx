import type { Actor, ReporteeRelation } from "../types/domain.ts";
import { ActorKindBadge } from "./ActorKindBadge.tsx";
import { buildOrgHierarchyRows } from "../utils/org-hierarchy.ts";

interface OrgTableViewProps {
  actors: Actor[];
  reportees: ReporteeRelation[];
  onOpenActor?: (actorId: string) => void;
}

export function OrgTableView({ actors, reportees, onOpenActor }: OrgTableViewProps) {
  const rows = buildOrgHierarchyRows({ actors, reportees });
  const actorById = new Map(
    (Array.isArray(actors) ? actors : []).map((actor) => [String(actor.id || "").trim(), actor] as const),
  );

  if (rows.length === 0) {
    return (
      <div className="task-empty-panel">
        <p className="empty-hint">No actors available for this org chart.</p>
      </div>
    );
  }

  return (
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
          {rows.map((row) => (
            <tr key={row.actor.id}>
              <td>
                <div
                  className="org-actor-cell"
                  style={{ paddingLeft: `${row.depth * 1.1 + 0.85}rem` }}
                >
                  <span className="org-tree-marker" aria-hidden="true">
                    {row.depth > 0 ? "↳" : "•"}
                  </span>
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
  );
}
