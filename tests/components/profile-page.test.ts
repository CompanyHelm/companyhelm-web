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
      isSavingProfileName: false,
      selectedCompany: {
        name: "Acme",
      },
      tasks: [],
      skills: [],
      agents: [],
      agentRunners: [],
      onSaveProfileName: () => true,
      onSignOut: () => {},
      ...overrides,
    }),
  );
}

test("ProfilePage renders a logout button", () => {
  const markup = renderProfilePageMarkup();

  assert.match(markup, />Log out</);
});

test("ProfilePage renders editable profile name fields", () => {
  const markup = renderProfilePageMarkup();

  assert.match(markup, /profile-first-name/);
  assert.match(markup, /profile-last-name/);
  assert.match(markup, />Save profile</);
  assert.match(markup, />Alex Smith</);
});
