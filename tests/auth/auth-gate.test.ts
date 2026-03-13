import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AuthGate from "../../src/auth/AuthGate.tsx";

function renderAuthGateMarkup() {
  return renderToStaticMarkup(
    React.createElement(
      AuthGate,
      null,
      React.createElement("div", null, "Authenticated content"),
    ),
  );
}

function getInputMarkup(markup: string, inputId: string) {
  const pattern = new RegExp(`<input[^>]*id="${inputId}"[^>]*>`);
  const match = markup.match(pattern);
  assert.ok(match, `Expected to find input "${inputId}" in markup.`);
  return match[0];
}

test("AuthGate sign-in form exposes standard autofill metadata", () => {
  const markup = renderAuthGateMarkup();
  const emailInputMarkup = getInputMarkup(markup, "auth-email");
  const passwordInputMarkup = getInputMarkup(markup, "auth-password");

  assert.match(emailInputMarkup, /name="email"/);
  assert.match(emailInputMarkup, /autoComplete="email"/);
  assert.match(passwordInputMarkup, /name="password"/);
  assert.match(passwordInputMarkup, /autoComplete="current-password"/);
});
