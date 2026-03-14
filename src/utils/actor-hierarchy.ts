import type { Actor, ReporteeRelation } from "./../types/domain.ts";

export interface ActorHierarchyRow {
  actor: Actor;
  depth: number;
  managerActorId: string | null;
  reportCount: number;
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

export function buildActorDescendantRows(params: {
  actorId: string;
  actors: Actor[];
  reportees: ReporteeRelation[];
}): ActorHierarchyRow[] {
  const rootActorId = String(params.actorId || "").trim();
  if (!rootActorId) {
    return [];
  }

  const actorList = Array.isArray(params.actors) ? params.actors : [];
  const relationList = Array.isArray(params.reportees) ? params.reportees : [];
  const actorById = new Map(
    actorList.map((actor) => [String(actor?.id || "").trim(), actor] as const).filter(([id]) => Boolean(id)),
  );
  const reportIdsByManagerId = new Map<string, string[]>();
  const managerIdByReporteeId = new Map<string, string>();

  for (const relation of relationList) {
    const managerActorId = String(relation?.managerActorId || "").trim();
    const reporteeActorId = String(relation?.reporteeActorId || "").trim();
    if (!managerActorId || !reporteeActorId || managerActorId === reporteeActorId) {
      continue;
    }

    managerIdByReporteeId.set(reporteeActorId, managerActorId);
    const existing = reportIdsByManagerId.get(managerActorId);
    if (existing) {
      existing.push(reporteeActorId);
    } else {
      reportIdsByManagerId.set(managerActorId, [reporteeActorId]);
    }
  }

  const sortActorIds = (actorIds: string[]) =>
    [...actorIds].sort((leftId, rightId) => compareActors(actorById.get(leftId)!, actorById.get(rightId)!));

  const rows: ActorHierarchyRow[] = [];
  const visitedActorIds = new Set<string>();

  function visit(managerActorId: string, depth: number) {
    const childActorIds = sortActorIds(
      (reportIdsByManagerId.get(managerActorId) || []).filter((childActorId) => actorById.has(childActorId)),
    );
    for (const childActorId of childActorIds) {
      if (visitedActorIds.has(childActorId)) {
        continue;
      }
      visitedActorIds.add(childActorId);
      const actor = actorById.get(childActorId);
      if (!actor) {
        continue;
      }
      const reportCount = (reportIdsByManagerId.get(childActorId) || [])
        .filter((nextActorId) => actorById.has(nextActorId))
        .length;
      rows.push({
        actor,
        depth,
        managerActorId: managerIdByReporteeId.get(childActorId) ?? null,
        reportCount,
      });
      visit(childActorId, depth + 1);
    }
  }

  visit(rootActorId, 1);
  return rows;
}
