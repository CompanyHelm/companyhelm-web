import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentCreatedActions } from "../../src/components/AgentCreatedActions.tsx";

function renderAgentCreatedActionsMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(AgentCreatedActions, {
      agentName: "CEO Agent",
      isCreatingChat: false,
      onChatNow: () => {},
      onSkipForNow: () => {},
      ...overrides,
    }),
  );
}

test("AgentCreatedActions renders the created agent name and both actions", () => {
  const markup = renderAgentCreatedActionsMarkup();

  assert.match(markup, />Agent created</);
  assert.match(markup, />CEO Agent</);
  assert.match(markup, />Chat now</);
  assert.match(markup, />Skip for now</);
});

test("AgentCreatedActions disables both actions while chat creation is in progress", () => {
  const markup = renderAgentCreatedActionsMarkup({
    isCreatingChat: true,
  });

  assert.match(markup, />Starting chat\.\.\.</);
  assert.match(markup, /<button[^>]*disabled=""[^>]*>\s*Starting chat\.\.\.\s*<\/button>/);
  assert.match(markup, /<button[^>]*disabled=""[^>]*>\s*Skip for now\s*<\/button>/);
});
