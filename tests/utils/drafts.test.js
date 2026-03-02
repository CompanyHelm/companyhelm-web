import assert from "node:assert/strict";
import test from "node:test";
import { createRelationshipDrafts } from "../../src/utils/drafts.js";

test("createRelationshipDrafts normalizes dependencyTaskIds for each task", () => {
  const drafts = createRelationshipDrafts([
    {
      id: "task-1",
      dependencyTaskIds: ["task-2", "task-3", "task-2", " "],
    },
    {
      id: "task-2",
      dependencyTaskIds: null,
    },
  ]);

  assert.deepEqual(drafts, {
    "task-1": {
      dependencyTaskIds: ["task-2", "task-3"],
    },
    "task-2": {
      dependencyTaskIds: [],
    },
  });
});
