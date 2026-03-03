import assert from "node:assert/strict";
import test from "node:test";
import { createRelationshipDrafts } from "../../src/utils/drafts.js";

test("createRelationshipDrafts normalizes dependencyTaskIds and parent/child relationships", () => {
  const drafts = createRelationshipDrafts([
    {
      id: "task-1",
      parentTaskId: null,
      dependencyTaskIds: ["task-2", "task-3", "task-2", " "],
    },
    {
      id: "task-2",
      parentTaskId: "task-1",
      dependencyTaskIds: null,
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
    },
    "task-2": {
      dependencyTaskIds: [],
      parentTaskId: "task-1",
      childTaskIds: [],
    },
    "task-3": {
      dependencyTaskIds: [],
      parentTaskId: "task-1",
      childTaskIds: [],
    },
  });
});
