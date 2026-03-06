import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfilePage } from "../../src/pages/ProfilePage.tsx";

function renderProfilePageMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(ProfilePage, {
      currentUser: {
        firstName: "Alex",
        lastName: "Smith",
        email: "alex@example.com",
      },
      currentUserError: "",
      isLoadingCurrentUser: false,
      selectedCompany: {
        name: "Acme",
      },
      tasks: [],
      skills: [],
      agents: [],
      agentRunners: [],
      onSignOut: () => {},
      ...overrides,
    }),
  );
}

test("ProfilePage renders a logout button", () => {
  const markup = renderProfilePageMarkup();

  assert.match(markup, />Log out</);
});

function findButtonElement(node: unknown): any {
  if (!node) {
    return null;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findButtonElement(child);
      if (match) {
        return match;
      }
    }
    return null;
  }
  if (!React.isValidElement(node)) {
    return null;
  }
  if (node.type === "button") {
    return node;
  }
  return findButtonElement(node.props?.children);
}

test("ProfilePage wires logout button to onSignOut", () => {
  let signOutCount = 0;
  const element = ProfilePage({
    currentUser: {
      firstName: "Alex",
      lastName: "Smith",
      email: "alex@example.com",
    },
    currentUserError: "",
    isLoadingCurrentUser: false,
    selectedCompany: {
      name: "Acme",
    },
    tasks: [],
    skills: [],
    agents: [],
    agentRunners: [],
    onSignOut: () => {
      signOutCount += 1;
    },
  });

  const button = findButtonElement(element);
  assert.ok(button);
  button.props.onClick();
  assert.equal(signOutCount, 1);
});
