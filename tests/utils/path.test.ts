import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGithubAppInstallUrl,
  clearGithubInstallCallbackFromLocation,
  getAdminRouteFromPathname,
  getTasksRouteFromPathname,
  resolveAdminTableNameForRoute,
} from "../../src/utils/path.ts";

type GlobalWithWindow = typeof global & {
  window?: Window & typeof globalThis;
  PopStateEvent?: typeof PopStateEvent;
};

const testGlobal = global as GlobalWithWindow;

function createMockWindow(initialHref: string): Window & typeof globalThis {
  const location = new URL(initialHref);

  const updateLocation = (nextPath: string) => {
    const nextUrl = new URL(nextPath, location.origin);
    location.pathname = nextUrl.pathname;
    location.search = nextUrl.search;
    location.hash = nextUrl.hash;
    location.href = nextUrl.href;
  };

  return {
    location,
    history: {
      pushState: (_state: any, _title: string, nextPath?: string | URL | null) => {
        updateLocation(String(nextPath || "/"));
      },
      replaceState: (_state: any, _title: string, nextPath?: string | URL | null) => {
        updateLocation(String(nextPath || "/"));
      },
    } as History,
    dispatchEvent: () => true,
  } as Window & typeof globalThis;
}

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

test("getAdminRouteFromPathname returns table view for /admin/tables/:tableName", () => {
  assert.deepEqual(getAdminRouteFromPathname("/admin/tables/Runner_Requests"), {
    view: "table",
    tableName: "runner_requests",
  });
});

test("resolveAdminTableNameForRoute returns the normalized table name for table routes", () => {
  assert.equal(
    resolveAdminTableNameForRoute({
      view: "table",
      tableName: " Runner_Requests ",
    }),
    "runner_requests",
  );
});

test("resolveAdminTableNameForRoute falls back to the default table when the route is not a table view", () => {
  assert.equal(
    resolveAdminTableNameForRoute({
      view: "home",
      tableName: "ignored_table",
    }),
    "runner_requests",
  );
});

test("clearGithubInstallCallbackFromLocation replaces the callback URL with /repos", () => {
  const originalWindow = testGlobal.window;
  const originalPopStateEvent = testGlobal.PopStateEvent;

  try {
    testGlobal.window = createMockWindow("https://example.test/github/install?installation_id=123");
    testGlobal.PopStateEvent = class PopStateEvent {
      type: string;

      constructor(type: string) {
        this.type = type;
      }
    } as typeof PopStateEvent;

    clearGithubInstallCallbackFromLocation();

    assert.equal(testGlobal.window.location.pathname, "/repos");
    assert.equal(testGlobal.window.location.search, "");
  } finally {
    if (typeof originalWindow === "undefined") {
      Reflect.deleteProperty(testGlobal, "window");
    } else {
      testGlobal.window = originalWindow;
    }

    if (typeof originalPopStateEvent === "undefined") {
      Reflect.deleteProperty(testGlobal, "PopStateEvent");
    } else {
      testGlobal.PopStateEvent = originalPopStateEvent;
    }
  }
});

test("buildGithubAppInstallUrl returns an empty string when no app link is configured", () => {
  assert.equal(buildGithubAppInstallUrl({ appLink: "", companyId: "company-1" }), "");
});

test("buildGithubAppInstallUrl appends installations/new and state to the configured app link", () => {
  assert.equal(
    buildGithubAppInstallUrl({
      appLink: "https://github.com/apps/example-local",
      companyId: "company-1",
    }),
    "https://github.com/apps/example-local/installations/new?state=company-1",
  );
});
