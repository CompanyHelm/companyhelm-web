import assert from "node:assert/strict";
import test from "node:test";
import { createRelationshipDrafts } from "../../src/utils/drafts.ts";

test("createRelationshipDrafts normalizes dependencyTaskIds and parent/child relationships", () => {
  const drafts = createRelationshipDrafts([
    {
      id: "task-1",
      parentTaskId: null,
      dependencyTaskIds: ["task-2", "task-3", "task-2", " "],
      assigneePrincipalId: "principal-user-1",
      status: "pending",
    },
    {
      id: "task-2",
      parentTaskId: "task-1",
      dependencyTaskIds: null,
      assigneePrincipalId: null,
      status: "draft",
    },
    {
      id: "task-3",
      parentTaskId: "task-1",
      dependencyTaskIds: [],
    },
  ]);

  assert.deepEqual(drafts, {
    "task-1": {
      dependencyTaskIds: ["task-2", "task-3"],
      parentTaskId: "",
      childTaskIds: ["task-2", "task-3"],
      assigneePrincipalId: "principal-user-1",
      status: "pending",
    },
    "task-2": {
      dependencyTaskIds: [],
      parentTaskId: "task-1",
      childTaskIds: [],
      assigneePrincipalId: "",
      status: "draft",
    },
    "task-3": {
      dependencyTaskIds: [],
      parentTaskId: "task-1",
      childTaskIds: [],
      assigneePrincipalId: "",
      status: "draft",
    },
  });
});

test("createRelationshipDrafts can source child relationships from a broader task list", () => {
  const drafts = createRelationshipDrafts(
    [
      {
        id: "task-1",
        parentTaskId: null,
        dependencyTaskIds: [],
        assigneePrincipalId: null,
        status: "draft",
      },
    ],
    [
      {
        id: "task-1",
        parentTaskId: null,
      },
      {
        id: "task-2",
        parentTaskId: "task-1",
      },
    ],
  );

  assert.deepEqual(drafts["task-1"]?.childTaskIds, ["task-2"]);
});
