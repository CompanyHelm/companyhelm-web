import assert from "node:assert/strict";
import test from "node:test";
import * as AppModule from "../../src/App.tsx";

test("reloadGithubDataAfterInstallationChange reloads repositories on the repos page", async () => {
  const { reloadGithubDataAfterInstallationChange } = AppModule as Record<string, any>;
  const calls: string[] = [];

  await reloadGithubDataAfterInstallationChange({
    activePage: "repos",
    loadGithubInstallations: async () => {
      calls.push("installations");
    },
    loadGithubRepositories: async () => {
      calls.push("repositories");
    },
  });

  assert.deepEqual(calls, ["installations", "repositories"]);
});

test("reloadGithubDataAfterInstallationChange skips repository reloads off the repos page", async () => {
  const { reloadGithubDataAfterInstallationChange } = AppModule as Record<string, any>;
  const calls: string[] = [];

  await reloadGithubDataAfterInstallationChange({
    activePage: "settings",
    loadGithubInstallations: async () => {
      calls.push("installations");
    },
    loadGithubRepositories: async () => {
      calls.push("repositories");
    },
  });

  assert.deepEqual(calls, ["installations"]);
});
