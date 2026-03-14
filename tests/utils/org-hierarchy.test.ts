import assert from "node:assert/strict";
import test from "node:test";
import type { Actor, ReporteeRelation } from "../../src/types/domain.ts";
import { buildOrgHierarchyRows } from "../../src/utils/org-hierarchy.ts";

test("buildOrgHierarchyRows nests reportees beneath their managers", () => {
  const actors: Actor[] = [
    { id: "actor-manager", kind: "user", displayName: "Jane Doe" },
    { id: "actor-reportee", kind: "agent", displayName: "Build Agent" },
  ];
  const reportees: ReporteeRelation[] = [
    {
      id: "relation-1",
      companyId: "company-1",
      managerActorId: "actor-manager",
      reporteeActorId: "actor-reportee",
    },
  ];

  const rows = buildOrgHierarchyRows({ actors, reportees });

  assert.deepEqual(
    rows.map((row) => ({
      actorId: row.actor.id,
      depth: row.depth,
      managerActorId: row.managerActorId,
    })),
    [
      { actorId: "actor-manager", depth: 0, managerActorId: null },
      { actorId: "actor-reportee", depth: 1, managerActorId: "actor-manager" },
    ],
  );
});

test("buildOrgHierarchyRows keeps unassigned actors at the root level", () => {
  const rows = buildOrgHierarchyRows({
    actors: [
      { id: "actor-1", kind: "user", displayName: "Jane Doe" },
      { id: "actor-2", kind: "agent", displayName: "Ops Agent" },
    ],
    reportees: [],
  });

  assert.deepEqual(
    rows.map((row) => ({ actorId: row.actor.id, depth: row.depth })),
    [
      { actorId: "actor-1", depth: 0 },
      { actorId: "actor-2", depth: 0 },
    ],
  );
});
