import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getConversationsPath,
  getConversationsRouteFromLocation,
  getPageFromPathname,
} from "../../src/utils/path.ts";

const appSource = readFileSync(new URL("../../src/App.tsx", import.meta.url), "utf8");

test("getPageFromPathname resolves the conversations workspace page", () => {
  assert.equal(getPageFromPathname("/conversations"), "conversations");
});

test("getConversationsRouteFromLocation reads the selected conversation id from the query string", () => {
  assert.deepEqual(
    getConversationsRouteFromLocation({
      pathname: "/conversations",
      search: "?conversationId=conversation-123",
    }),
    { conversationId: "conversation-123" },
  );
});

test("getConversationsPath includes the selected conversation id when provided", () => {
  assert.equal(
    getConversationsPath({ conversationId: "conversation-123" }),
    "/conversations?conversationId=conversation-123",
  );
  assert.equal(getConversationsPath(), "/conversations");
});

test("App keeps conversations route state in sync with browser navigation", () => {
  assert.match(appSource, /const \[conversationsRoute, setConversationsRoute\] = useState<any>\(\(\) => getConversationsRouteFromLocation\(\)\);/);
  assert.match(appSource, /setConversationsRoute\(getConversationsRouteFromLocation\(\)\);/);
  assert.match(appSource, /activePage === "conversations"/);
  assert.match(appSource, /setBrowserPath\(getConversationsPath\(\{ conversationId \}\)\)/);
});
