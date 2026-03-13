import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const indexCssSource = readFileSync(
  new URL("../../src/index.css", import.meta.url),
  "utf8",
);

test("chat layout does not hide the breadcrumb panel", () => {
  assert.doesNotMatch(
    indexCssSource,
    /\.page-shell-chat-layout\s+\.breadcrumb-panel\s*\{\s*display:\s*none;\s*\}/,
  );
});

test("mobile chat layout keeps modal cards on an opaque surface", () => {
  assert.match(
    indexCssSource,
    /\.page-shell-chat-layout\s+:is\(\s*\.modal-card,\s*\.modal-card-wide,\s*\.modal-card-fullscreen\s*\)\s*\{[^}]*background:\s*#f6f6f2;/s,
  );
});
