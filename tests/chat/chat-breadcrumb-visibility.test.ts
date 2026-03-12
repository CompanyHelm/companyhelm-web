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
