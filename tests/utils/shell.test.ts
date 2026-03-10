import assert from "node:assert/strict";
import test from "node:test";
import { buildRunnerStartCommand } from "../../src/utils/shell.ts";

test("buildRunnerStartCommand returns the runner start command with secret", () => {
  const command = buildRunnerStartCommand({
    backendGrpcTarget: "runner.companyhelm.internal:50051",
    runnerSecret: "secret-123",
  });

  assert.equal(command, "companyhelm runner start --secret secret-123");
});
