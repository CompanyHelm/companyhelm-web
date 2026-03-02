import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig, getConfig, clearConfigCache } from "../../scripts/config/config.js";
import { resolveViteCommand } from "../../scripts/vite.js";

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

test("loadConfig parses local config with expected fields", () => {
  const config = loadConfig("local");
  assert.equal(config.server.host, "127.0.0.1");
  assert.equal(config.server.listeningPort, 5173);
  assert.equal(config.api.graphqlApiUrl, "http://127.0.0.1:4000/graphql");
});

test("getConfig defaults to APP_ENV with local fallback", () => {
  const previous = process.env.APP_ENV;
  process.env.APP_ENV = "local";
  clearConfigCache();

  const config = getConfig();
  assert.equal(config.server.host, "127.0.0.1");

  if (previous === undefined) {
    delete process.env.APP_ENV;
  } else {
    process.env.APP_ENV = previous;
  }
  clearConfigCache();
});
