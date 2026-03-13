import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const indexCssSource = readFileSync(
  new URL("../../src/index.css", import.meta.url),
  "utf8",
);

test("idle chat composer keeps the textarea and send button inline on desktop", () => {
  assert.match(
    indexCssSource,
    /\.chat-composer-input-row\.chat-composer-input-row-idle\s*\{[^}]*flex-direction:\s*row;[^}]*align-items:\s*flex-end;/s,
  );

  assert.match(
    indexCssSource,
    /\.chat-composer-input-row\.chat-composer-input-row-idle\s+\.chat-composer-toolbar\s*\{[^}]*width:\s*auto;[^}]*justify-items:\s*flex-end;/s,
  );
});

test("mobile chat composer keeps the textarea and send button inline", () => {
  assert.match(
    indexCssSource,
    /@media\s*\(max-width:\s*760px\)\s*\{[\s\S]*?\.chat-composer-input-row\.chat-composer-input-row-idle\s*\{[^}]*flex-direction:\s*row;[^}]*align-items:\s*flex-end;/s,
  );

  assert.match(
    indexCssSource,
    /@media\s*\(max-width:\s*760px\)\s*\{[\s\S]*?\.chat-composer-input-row\.chat-composer-input-row-idle\s+\.chat-composer-toolbar\s*\{[^}]*width:\s*auto;[^}]*justify-items:\s*flex-end;/s,
  );
});
