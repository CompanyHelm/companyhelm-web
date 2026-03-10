import assert from "node:assert/strict";
import test from "node:test";
import { getPageFromPathname, getPathForPage, getTasksRouteFromPathname } from "../../src/utils/path.ts";

test("getTasksRouteFromPathname returns list view for /tasks", () => {
  assert.deepEqual(getTasksRouteFromPathname("/tasks"), { view: "list", taskId: "" });
});

test("getTasksRouteFromPathname returns detail view for /tasks/:taskId", () => {
  assert.deepEqual(getTasksRouteFromPathname("/tasks/task-123"), {
    view: "detail",
    taskId: "task-123",
  });
});

test("getTasksRouteFromPathname ignores non-task paths", () => {
  assert.deepEqual(getTasksRouteFromPathname("/skills/skill-1"), { view: "list", taskId: "" });
});

test("getPageFromPathname still resolves /secrets", () => {
  assert.equal(getPageFromPathname("/secrets"), "secrets");
});

test("getPathForPage still returns /secrets", () => {
  assert.equal(getPathForPage("secrets"), "/secrets");
});
