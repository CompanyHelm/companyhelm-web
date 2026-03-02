import assert from "node:assert/strict";
import test from "node:test";
import { buildTaskDependencyLanes } from "../../src/utils/task-graph.js";

test("buildTaskDependencyLanes groups tasks by prerequisite depth", () => {
  const lanes = buildTaskDependencyLanes([
    {
      id: "task-1",
      name: "Design schema",
      status: "draft",
      dependencyTaskIds: [],
      comments: [{ id: "comment-1" }, { id: "comment-2" }],
    },
    {
      id: "task-2",
      name: "Build API",
      status: "pending",
      dependencyTaskIds: ["task-1"],
      comments: [],
    },
    {
      id: "task-3",
      name: "Wire UI",
      status: "pending",
      dependencyTaskIds: ["task-1"],
      comments: [{ id: "comment-3" }],
    },
    {
      id: "task-4",
      name: "Run e2e",
      status: "in_progress",
      dependencyTaskIds: ["task-2", "task-3"],
      comments: [],
    },
    {
      id: "task-5",
      name: "Cleanup",
      status: "draft",
      dependencyTaskIds: ["missing-task", "task-5"],
      comments: [],
    },
  ]);

  assert.deepEqual(
    lanes.map((lane) => ({
      level: lane.level,
      title: lane.title,
      taskIds: lane.tasks.map((task) => task.id),
    })),
    [
      { level: 0, title: "Foundations", taskIds: ["task-5", "task-1"] },
      { level: 1, title: "Layer 2", taskIds: ["task-2", "task-3"] },
      { level: 2, title: "Layer 3", taskIds: ["task-4"] },
    ],
  );

  const task1 = lanes[0].tasks.find((task) => task.id === "task-1");
  const task4 = lanes[2].tasks.find((task) => task.id === "task-4");
  assert.equal(task1?.commentCount, 2);
  assert.deepEqual(task1?.dependentTaskIds, ["task-2", "task-3"]);
  assert.deepEqual(task4?.dependencyTaskIds, ["task-2", "task-3"]);
});

test("buildTaskDependencyLanes falls back safely when input has a cycle", () => {
  const lanes = buildTaskDependencyLanes([
    {
      id: "task-1",
      name: "A",
      dependencyTaskIds: ["task-2"],
    },
    {
      id: "task-2",
      name: "B",
      dependencyTaskIds: ["task-1"],
    },
  ]);

  assert.deepEqual(
    lanes.map((lane) => lane.tasks.map((task) => task.id)),
    [["task-1", "task-2"]],
  );
});
