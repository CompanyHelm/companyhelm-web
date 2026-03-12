import assert from "node:assert/strict";
import test from "node:test";
import { buildRunnerStartCommand } from "../../src/utils/shell.ts";

test("buildRunnerStartCommand returns the runner start command with secret", () => {
  const command = buildRunnerStartCommand({
    backendGrpcTarget: "runner.companyhelm.internal:50051",
    runnerSecret: "secret-123",
  });

  assert.equal(command, "npx @companyhelm/runner start --secret secret-123");
});

test("buildRunnerStartCommand includes onboarding flags when requested", () => {
  const command = buildRunnerStartCommand({
    runnerSecret: "secret-123",
    useHostDockerRuntime: true,
    useDedicatedAuth: true,
    daemon: true,
  });

  assert.equal(
    command,
    "npx @companyhelm/runner start --use-host-docker-runtime --use-dedicated-auth --secret secret-123 --daemon",
  );
});
