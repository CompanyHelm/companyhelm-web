import type { Actor, ReporteeRelation } from "../types/domain.ts";
import { buildOrgHierarchyRows } from "../utils/org-hierarchy.ts";

interface OrgTableViewProps {
  actors: Actor[];
  reportees: ReporteeRelation[];
}

export function OrgTableView({ actors, reportees }: OrgTableViewProps) {
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
                  <span>{row.actor.displayName}</span>
                </div>
              </td>
              <td>
                <span className={`org-kind-pill org-kind-pill-${row.actor.kind}`}>
                  {row.actor.kind}
                </span>
              </td>
              <td>{row.managerActorId ? (actorById.get(row.managerActorId)?.displayName || row.managerActorId) : "Root"}</td>
              <td>{row.reportCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
