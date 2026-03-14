import type { Actor, ReporteeRelation } from "./../types/domain.ts";

export interface OrgHierarchyRow {
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

export function buildOrgHierarchyRows(params: {
  actors: Actor[];
  reportees: ReporteeRelation[];
}): OrgHierarchyRow[] {
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

  const rootActorIds = sortActorIds(
    actorList
      .map((actor) => String(actor?.id || "").trim())
      .filter((actorId) => actorId && !managerIdByReporteeId.has(actorId)),
  );
  const visitedActorIds = new Set<string>();
  const rows: OrgHierarchyRow[] = [];

  function visit(actorId: string, depth: number) {
    if (visitedActorIds.has(actorId)) {
      return;
    }
    visitedActorIds.add(actorId);

    const actor = actorById.get(actorId);
    if (!actor) {
      return;
    }

    const childActorIds = sortActorIds(
      (reportIdsByManagerId.get(actorId) || []).filter((childActorId) => actorById.has(childActorId)),
    );
    rows.push({
      actor,
      depth,
      managerActorId: managerIdByReporteeId.get(actorId) ?? null,
      reportCount: childActorIds.length,
    });
    for (const childActorId of childActorIds) {
      visit(childActorId, depth + 1);
    }
  }

  for (const rootActorId of rootActorIds) {
    visit(rootActorId, 0);
  }

  const remainingActorIds = sortActorIds(
    actorList
      .map((actor) => String(actor?.id || "").trim())
      .filter((actorId) => actorId && !visitedActorIds.has(actorId)),
  );
  for (const actorId of remainingActorIds) {
    visit(actorId, 0);
  }

  return rows;
}
