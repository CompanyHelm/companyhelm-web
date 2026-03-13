import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const indexCssSource = readFileSync(
  new URL("../../src/index.css", import.meta.url),
  "utf8",
);

test("onboarding stepper width is widened to 57rem", () => {
  assert.match(
    indexCssSource,
    /\.onboarding-stepper\s*\{[^}]*width:\s*min\(57rem,\s*100%\);/s,
  );
});

test("onboarding panels are widened to 57rem", () => {
  assert.match(
    indexCssSource,
    /\.runner-onboarding-panel\s*\{[^}]*width:\s*min\(57rem,\s*100%\);/s,
  );
});

test("shared page width remains unchanged", () => {
  assert.match(
    indexCssSource,
    /\.page-container\s*\{[^}]*max-width:\s*1000px;/s,
  );
});
