import assert from "node:assert/strict";
import test from "node:test";
import * as AppModule from "../../src/App.tsx";

test("getChatCreateBlockedReason returns Disconnected for assigned runners that are not chat-ready", () => {
  const getChatCreateBlockedReason = (AppModule as Record<string, any>).getChatCreateBlockedReason;

  assert.equal(
    getChatCreateBlockedReason(
      {
        agentRunnerId: "runner-1",
      },
      new Map([
        [
          "runner-1",
          {
            id: "runner-1",
            isConnected: false,
            availableAgentSdks: [
              {
                name: "codex",
                status: "ready",
              },
            ],
          },
        ],
      ]),
    ),
    "Disconnected",
  );
});
