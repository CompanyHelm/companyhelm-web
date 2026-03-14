import assert from "node:assert/strict";
import test from "node:test";
import type { Actor, ReporteeRelation } from "../../src/types/domain.ts";
import { buildActorDescendantRows } from "../../src/utils/actor-hierarchy.ts";

test("buildActorDescendantRows returns the full descendant hierarchy with depth", () => {
  const actors: Actor[] = [
    { id: "actor-1", kind: "user", displayName: "Jane Doe" },
    { id: "actor-2", kind: "agent", displayName: "Build Agent" },
    { id: "actor-3", kind: "user", displayName: "Sam Ops" },
    { id: "actor-4", kind: "agent", displayName: "Ignored Agent" },
  ];
  const reportees: ReporteeRelation[] = [
    {
      id: "relation-1",
      companyId: "company-1",
      managerActorId: "actor-1",
      reporteeActorId: "actor-2",
    },
    {
      id: "relation-2",
      companyId: "company-1",
      managerActorId: "actor-2",
      reporteeActorId: "actor-3",
    },
    {
      id: "relation-3",
      companyId: "company-1",
      managerActorId: "actor-4",
      reporteeActorId: "actor-1",
    },
  ];

  const rows = buildActorDescendantRows({
    actorId: "actor-1",
    actors,
    reportees,
  });

  assert.deepEqual(
    rows.map((row) => ({
      actorId: row.actor.id,
      depth: row.depth,
      managerActorId: row.managerActorId,
    })),
    [
      { actorId: "actor-2", depth: 1, managerActorId: "actor-1" },
      { actorId: "actor-3", depth: 2, managerActorId: "actor-2" },
    ],
  );
});
