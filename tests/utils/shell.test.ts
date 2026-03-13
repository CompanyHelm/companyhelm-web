import assert from "node:assert/strict";
import test from "node:test";
import { buildRunnerStartCommand } from "../../src/utils/shell.ts";

test("buildRunnerStartCommand returns the runner start command with secret", () => {
  const command = buildRunnerStartCommand({
    runnerSecret: "secret-123",
  });

  assert.equal(command, "npx @companyhelm/runner start --secret secret-123");
});

test("buildRunnerStartCommand ignores deprecated onboarding flags", () => {
  const command = buildRunnerStartCommand(
    {
      runnerSecret: "secret-123",
      useHostDockerRuntime: true,
      useDedicatedAuth: true,
      daemon: true,
    } as any,
  );

  assert.equal(
    command,
    "npx @companyhelm/runner start --secret secret-123 --daemon",
  );
});
