import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConfirmationModal } from "../../src/components/ConfirmationModal.tsx";

function renderConfirmationModalMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(ConfirmationModal, {
      modalId: "delete-company-confirmation",
      isOpen: true,
      title: "Delete company",
      message: 'Delete company "Acme"? This removes all company data.',
      confirmLabel: "Delete company",
      cancelLabel: "Cancel",
      tone: "danger",
      isConfirming: false,
      onConfirm: () => {},
      onClose: () => {},
      ...overrides,
    }),
  );
}

test("ConfirmationModal renders destructive confirmation copy and actions", () => {
  const markup = renderConfirmationModalMarkup();

  assert.match(markup, />Delete company</);
  assert.match(markup, /Delete company &quot;Acme&quot;\? This removes all company data\./);
  assert.match(markup, /class="danger-btn"/);
  assert.match(markup, />Delete company</);
  assert.match(markup, />Cancel</);
});

test("ConfirmationModal renders nothing when closed", () => {
  const markup = renderConfirmationModalMarkup({ isOpen: false });

  assert.equal(markup, "");
});
