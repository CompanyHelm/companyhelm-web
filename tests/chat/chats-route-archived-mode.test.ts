import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const appSource = readFileSync(
  new URL("../../src/App.tsx", import.meta.url),
  "utf8",
);

test("chats route forces the active chat filter", () => {
  assert.match(
    appSource,
    /if \(!selectedCompanyId \|\| activePage !== "chats"\) \{\s*return;\s*\}\s*if \(chatListStatusFilter !== CHAT_LIST_STATUS_FILTER_ACTIVE\) \{\s*setChatListStatusFilter\(CHAT_LIST_STATUS_FILTER_ACTIVE\);/s,
  );
});

test("chats route disables archived mode in AgentChatPage", () => {
  assert.match(
    appSource,
    /activePage === "chats"[\s\S]*<AgentChatPage[\s\S]*allowArchivedMode=\{false\}/s,
  );
});
