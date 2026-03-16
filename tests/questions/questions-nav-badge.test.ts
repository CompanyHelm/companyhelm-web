import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const appSource = readFileSync(
  new URL("../../src/App.tsx", import.meta.url),
  "utf8",
);

test("App renders a questions nav badge for open questions", () => {
  assert.match(appSource, /item\.id === "questions"/);
  assert.match(appSource, /nav-link-badge/);
  assert.match(appSource, /openQuestionCount/);
});
