import assert from "node:assert/strict";
import test from "node:test";
import {
  buildConfigGenerateArgs,
  parseCliArgs,
} from "../../scripts/vite.js";

test("parseCliArgs defaults dev to the local config path", () => {
  assert.deepEqual(parseCliArgs(["dev"]), {
    viteCommand: "dev",
    configPath: "config/local.yaml",
    passthrough: [],
  });
});

test("parseCliArgs accepts --config-path", () => {
  assert.deepEqual(parseCliArgs(["build", "--config-path", "/tmp/companyhelm/frontend.yaml"]), {
    viteCommand: "build",
    configPath: "/tmp/companyhelm/frontend.yaml",
    passthrough: [],
  });
});

test("parseCliArgs rejects removed --environment", () => {
  assert.throws(
    () => parseCliArgs(["preview", "--environment", "prod"]),
    /--environment is no longer supported/,
  );
});

test("buildConfigGenerateArgs forwards the explicit config path", () => {
  assert.deepEqual(buildConfigGenerateArgs("/tmp/companyhelm/frontend.yaml"), [
    "run",
    "config:generate",
    "--",
    "--config-path",
    "/tmp/companyhelm/frontend.yaml",
  ]);
});
