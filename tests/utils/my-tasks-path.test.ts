import assert from "node:assert/strict";
import test from "node:test";
import {
  getPageFromPathname,
  getTaskPath,
  getTasksRouteFromPathname,
} from "../../src/utils/path.ts";

test("getPageFromPathname resolves the My Tasks page from /my-tasks", () => {
  assert.equal(getPageFromPathname("/my-tasks"), "my-tasks");
});

test("getTasksRouteFromPathname returns detail view for /my-tasks/:taskId", () => {
  assert.deepEqual(getTasksRouteFromPathname("/my-tasks/task-123"), {
    view: "detail",
    taskId: "task-123",
    tab: "overview",
  });
});

test("getTaskPath supports building My Tasks detail routes", () => {
  assert.equal(
    getTaskPath({ pageId: "my-tasks", taskId: "task-123", tab: "Graph" }),
    "/my-tasks/task-123?tab=graph",
  );
});
