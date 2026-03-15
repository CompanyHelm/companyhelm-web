import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const appSource = readFileSync(
  new URL("../../src/App.tsx", import.meta.url),
  "utf8",
);

test("chat conversation breadcrumbs skip the agent segment", () => {
  assert.match(
    appSource,
    /if \(activePage === "chats"\) \{\s*const items = \[\{ label: "Chats", href: "\/chats" \}\];\s*if \(chatAgentId && resolvedChatSessionId\) \{\s*items\.push\(\{\s*label: getChatLabel\(resolvedChatSessionId\),/s,
  );

  assert.doesNotMatch(
    appSource,
    /if \(activePage === "chats"\)[\s\S]*items\.push\(\{ label: getAgentLabel\(chatAgentId\), href: getChatsPath\(\{ agentId: chatAgentId \}\) \}\);/s,
  );
});
