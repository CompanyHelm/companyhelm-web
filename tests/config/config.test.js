import assert from "node:assert/strict";
import test from "node:test";
import {
  parseCliEnvironmentArgument,
  stripEnvironmentArguments,
} from "../../scripts/config/cli.js";
import { loadConfig } from "../../scripts/config/config.js";

test("parseCliEnvironmentArgument accepts '--environment <name>'", () => {
  const environment = parseCliEnvironmentArgument(["dev", "--environment", "local"]);
  assert.equal(environment, "local");
});

test("parseCliEnvironmentArgument accepts '--environment=<name>'", () => {
  const environment = parseCliEnvironmentArgument(["preview", "--environment=prod"]);
  assert.equal(environment, "prod");
});

test("parseCliEnvironmentArgument throws when --environment is missing", () => {
  assert.throws(
    () => parseCliEnvironmentArgument(["dev"]),
    /Missing required --environment <name> CLI argument\./
  );
});

test("parseCliEnvironmentArgument throws when --environment has no value", () => {
  assert.throws(
    () => parseCliEnvironmentArgument(["build", "--environment"]),
    /Missing value for --environment\./
  );
});

test("stripEnvironmentArguments removes '--environment' argument variants", () => {
  const stripped = stripEnvironmentArguments([
    "dev",
    "--host",
    "0.0.0.0",
    "--environment=local",
    "--environment",
    "dev",
    "--open",
  ]);

  assert.deepEqual(stripped, ["dev", "--host", "0.0.0.0", "--open"]);
});

test("loadConfig parses local config with expected fields", () => {
  const config = loadConfig("local");
  assert.equal(config.server.listeningPort, 5173);
  assert.equal(config.api.graphqlApiUrl, "http://127.0.0.1:4000/graphql");
});
