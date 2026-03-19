import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const appSource = readFileSync(
  new URL("../../src/App.tsx", import.meta.url),
  "utf8",
);

test("external agents navigation is filtered by the feature flag", () => {
  assert.match(
    appSource,
    /const visibleNavSections = useMemo\(\s*\(\) => NAV_SECTIONS\.map\(\(section: any\) => \(\{\s*\.\.\.section,\s*items: section\.items\.filter\(\(item: any\) => appFlags\.showExternalAgents \|\| item\.id !== "external_agents"\),/s,
  );
});

test("external agents routes redirect away when the feature flag is disabled", () => {
  assert.match(
    appSource,
    /if \(activePage === "external_agents" && !appFlags\.showExternalAgents\) \{\s*setBrowserPath\("\/dashboard", \{ replace: true \}\);\s*\}/s,
  );
});

test("external agents page rendering is gated by the feature flag", () => {
  assert.match(
    appSource,
    /selectedCompanyId && activePage === "external_agents" && appFlags\.showExternalAgents \? \(/s,
  );
});
