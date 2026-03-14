import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OrgPage } from "../../src/pages/OrgPage.tsx";

function renderOrgPageMarkup() {
  return renderToStaticMarkup(
    React.createElement(OrgPage, {
      actors: [
        { id: "actor-user-1", kind: "user", displayName: "Jane Doe" },
        { id: "actor-agent-1", kind: "agent", displayName: "Build Agent" },
      ],
      reportees: [
        {
          id: "relation-1",
          companyId: "company-1",
          managerActorId: "actor-user-1",
          reporteeActorId: "actor-agent-1",
        },
      ],
      isLoading: false,
      error: "",
    }),
  );
}

test("OrgPage renders table and graph tabs with the hierarchy table by default", () => {
  const markup = renderOrgPageMarkup();

  assert.match(markup, />Organization</);
  assert.match(markup, />Table</);
  assert.match(markup, />Graph</);
  assert.match(markup, /Jane Doe/);
  assert.match(markup, /Build Agent/);
  assert.match(markup, />Human</);
  assert.match(markup, />AI</);
  assert.match(markup, /Root/);
});

test("OrgPage renders an empty-state hint when there are no actors", () => {
  const markup = renderToStaticMarkup(
    React.createElement(OrgPage, {
      actors: [],
      reportees: [],
      isLoading: false,
      error: "",
    }),
  );

  assert.match(markup, /No actors available for this org chart\./);
});
