import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CreationModal } from "../../src/components/CreationModal.tsx";

function renderCreationModalMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(CreationModal, {
      modalId: "test-creation-modal",
      title: "Create item",
      description: "Create a new item.",
      isOpen: true,
      onClose: () => {},
      children: React.createElement("div", null, "Modal body"),
      ...overrides,
    }),
  );
}

test("CreationModal renders an icon-only close control with an accessible label", () => {
  const markup = renderCreationModalMarkup();

  assert.match(markup, /class="secondary-btn modal-close-btn"/);
  assert.match(markup, /aria-label="Close"/);
  assert.match(markup, /<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">/);
  assert.doesNotMatch(markup, />Close</);
});

test("CreationModal renders nothing when closed", () => {
  const markup = renderCreationModalMarkup({ isOpen: false });

  assert.equal(markup, "");
});
