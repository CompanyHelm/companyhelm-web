import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ActorPage } from "../../src/pages/ActorPage.tsx";

test("ActorPage defaults to the overview tab and renders markdown preview with actor type", () => {
  const markup = renderToStaticMarkup(
    React.createElement(ActorPage, {
      actor: {
        id: "actor-user-1",
        kind: "user",
        displayName: "Jane Doe",
        description: "Platform **lead**",
        email: "jane@example.com",
      },
      actors: [
        {
          id: "actor-user-1",
          kind: "user",
          displayName: "Jane Doe",
          description: "Platform **lead**",
          email: "jane@example.com",
        },
      ],
      reportees: [],
      isSaving: false,
      error: "",
      onSaveDescription: () => {},
    }),
  );

  assert.match(markup, />Overview</);
  assert.match(markup, />Reportees</);
  assert.match(markup, />Human</);
  assert.match(markup, /Platform/);
  assert.match(markup, /<strong>lead<\/strong>/);
});
