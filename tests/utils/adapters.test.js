import test from "node:test";
import assert from "node:assert/strict";
import { toLegacyThreadPayload } from "../../src/utils/adapters.js";

test("toLegacyThreadPayload includes thread error status and message", () => {
  const payload = toLegacyThreadPayload({
    id: "thread-1",
    status: "error",
    errorMessage: "Failed to provision thread runtime container.",
    company: { id: "company-1" },
    agent: { id: "agent-1" },
  });

  assert.equal(payload.status, "error");
  assert.equal(payload.errorMessage, "Failed to provision thread runtime container.");
});

