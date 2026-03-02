import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig, getConfig, clearConfigCache } from "../../scripts/config/config.js";
import { resolveViteCommand } from "../../scripts/vite.js";
import { parseCliEnvironmentArgument, stripEnvironmentArguments } from "../../scripts/config/cli.js";

test("resolveViteCommand accepts known vite commands", () => {
  assert.equal(resolveViteCommand(["dev"]), "dev");
  assert.equal(resolveViteCommand(["build"]), "build");
  assert.equal(resolveViteCommand(["preview"]), "preview");
});

test("resolveViteCommand rejects extra CLI options", () => {
  assert.throws(
    () => resolveViteCommand(["dev", "--host", "0.0.0.0"]),
    /Vite CLI options are disabled/
  );
});

test("parseCliEnvironmentArgument accepts '--environment <name>'", () => {
  const environment = parseCliEnvironmentArgument(["--environment", "local"]);
  assert.equal(environment, "local");
});

test("parseCliEnvironmentArgument accepts '--environment=<name>'", () => {
  const environment = parseCliEnvironmentArgument(["--environment=prod"]);
  assert.equal(environment, "prod");
});

test("parseCliEnvironmentArgument throws when environment is missing", () => {
  assert.throws(
    () => parseCliEnvironmentArgument([]),
    /Missing required --environment <name> CLI argument\./
  );
});

test("stripEnvironmentArguments removes environment flags", () => {
  const stripped = stripEnvironmentArguments(["--environment", "local", "--environment=prod"]);
  assert.deepEqual(stripped, []);
});

test("loadConfig parses local config with expected fields", () => {
  const config = loadConfig("local");
  assert.equal(config.server.host, "127.0.0.1");
  assert.equal(config.server.listeningPort, 5173);
  assert.equal(config.api.graphqlApiUrl, "http://127.0.0.1:4000/graphql");
  assert.equal(config.authProvider, "companyhelm");
  assert.equal(config.auth.companyhelm.tokenStorageKey, "companyhelm.auth.token");
  assert.equal(config.auth.supabase.tokenStorageKey, "supabase.access.token");
});

test("getConfig requires explicit environment initialization", () => {
  clearConfigCache();
  assert.throws(
    () => getConfig(),
    /Configuration was not initialized\. Pass --environment <name>/
  );
});

test("getConfig returns cached config after explicit environment init", () => {
  clearConfigCache();
  const config = getConfig("local");
  assert.equal(config.server.host, "127.0.0.1");
  clearConfigCache();
});
