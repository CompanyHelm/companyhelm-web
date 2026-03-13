import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const appSource = readFileSync(
  new URL("../../src/App.tsx", import.meta.url),
  "utf8",
);

test("App suppresses breadcrumbs on the chats overview route", () => {
  assert.match(
    appSource,
    /const shouldHideChatsOverviewBreadcrumbs = activePage === "chats" && !chatAgentId && !resolvedChatSessionId;/,
  );

  assert.match(
    appSource,
    /!shouldHideChatsOverviewBreadcrumbs \? \(\s*<Breadcrumbs/s,
  );
});
