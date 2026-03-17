import assert from "node:assert/strict";
import test from "node:test";
import { applyAgentRunnerSubscriptionSnapshot } from "../../src/utils/normalization.ts";

test("applyAgentRunnerSubscriptionSnapshot drops stale runners from another company", () => {
  const result = applyAgentRunnerSubscriptionSnapshot(
    [
      {
        id: "runner-1",
        companyId: "company-1",
        isConnected: true,
        name: "Runner One",
      },
    ],
    [
      {
        id: "runner-1",
        companyId: "company-1",
        isConnected: true,
        name: "Runner One",
      },
    ],
    "company-2",
  );

  assert.deepEqual(result, []);
});

test("applyAgentRunnerSubscriptionSnapshot replaces the current runner snapshot instead of merging removed runners back in", () => {
  const result = applyAgentRunnerSubscriptionSnapshot(
    [
      {
        id: "runner-1",
        companyId: "company-1",
        isConnected: true,
        name: "Runner One",
      },
      {
        id: "runner-2",
        companyId: "company-1",
        isConnected: false,
        name: "Runner Two",
      },
    ],
    [
      {
        id: "runner-2",
        companyId: "company-1",
        isConnected: true,
        name: "Runner Two",
      },
    ],
    "company-1",
  );

  assert.deepEqual(result, [
    {
      id: "runner-2",
      companyId: "company-1",
      isConnected: true,
      name: "Runner Two",
      availableAgentSdks: [],
    },
  ]);
});
