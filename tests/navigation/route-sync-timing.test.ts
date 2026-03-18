import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const appSource = readFileSync(
  new URL("../../src/App.tsx", import.meta.url),
  "utf8",
);

test("App registers route synchronization before first paint", () => {
  assert.match(
    appSource,
    /useLayoutEffect\(\(\) => \{\s*const legacyHashRoute = String\(window\.location\.hash \|\| ""\)[\s\S]*handlePopState\(\);\s*window\.addEventListener\("popstate", handlePopState\);/s,
  );
});
