import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DashboardPage } from "../../src/pages/DashboardPage.tsx";

function renderDashboardPageMarkup(runnerOverrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(DashboardPage, {
      selectedCompanyId: "company-1",
      selectedCompany: {
        id: "company-1",
        name: "Company One",
      },
      tasks: [],
      agentRunners: [
        {
          id: "runner-secret-1",
          name: "",
          isConnected: true,
          lastSeenAt: "2026-03-10T12:00:00.000Z",
          ...runnerOverrides,
        },
      ],
      isLoadingTasks: false,
      isLoadingRunners: false,
      taskError: "",
      runnerError: "",
      onNavigate: () => {},
    }),
  );
}

test("DashboardPage uses a neutral fallback when a runner name is missing", () => {
  const markup = renderDashboardPageMarkup();

  assert.match(markup, /Unnamed runner/);
  assert.doesNotMatch(markup, />runner-secret-1</);
});
