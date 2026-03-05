import assert from "node:assert/strict";
import test from "node:test";
import { buildRunnerStartCommand } from "../../src/utils/shell.ts";

test("buildRunnerStartCommand omits --server-url and only includes secret", () => {
  const command = buildRunnerStartCommand({
    backendGrpcTarget: "runner.companyhelm.internal:50051",
    runnerSecret: "secret-123",
  });

  assert.equal(command, "companyhelm --secret secret-123");
});
