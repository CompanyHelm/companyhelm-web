import assert from "node:assert/strict";
import test from "node:test";
import { clearConfigCache, getConfig, loadConfig } from "../../src/config/config.ts";
import { getDevelopmentConfig } from "../../src/config/development.ts";
import { runtimeConfigSchema, type RuntimeConfig } from "../../src/config/schema.ts";

type TestWindow = Window & typeof globalThis;

function withWindow<T>(nextWindow: TestWindow | undefined, fn: () => T): T {
  const globalWithWindow = global as typeof global & { window?: TestWindow };
  const originalWindow = globalWithWindow.window;
  try {
    if (typeof nextWindow === "undefined") {
      Reflect.deleteProperty(globalWithWindow, "window");
    } else {
      globalWithWindow.window = nextWindow;
    }
    return fn();
  } finally {
    if (typeof originalWindow === "undefined") {
      Reflect.deleteProperty(globalWithWindow, "window");
    } else {
      globalWithWindow.window = originalWindow;
    }
  }
}

test("getConfig defaults to development config when no runtime override exists", () => {
  clearConfigCache();
  const config = withWindow(undefined, () => getConfig());
  assert.deepEqual(config, getDevelopmentConfig());
});

test("getConfig caches results until clearConfigCache is called", () => {
  clearConfigCache();
  const first = withWindow(undefined, () => getConfig());
  const second = withWindow(undefined, () => getConfig());
  assert.equal(first, second);

  clearConfigCache();
  const third = withWindow(undefined, () => getConfig());
  assert.notEqual(first, third);
});

test("loadConfig prefers window runtime config override", () => {
  const runtimeConfig: RuntimeConfig = {
    api: {
      graphqlApiUrl: "https://api.example.com/graphql",
      runnerGrpcTarget: "runner.example.com:50051",
    },
    auth: {
      provider: "supabase",
      companyhelm: {
        tokenStorageKey: "companyhelm.auth.token",
      },
      supabase: {
        url: "https://example.supabase.co",
        anonKey: "anon-key",
        tokenStorageKey: "supabase.auth.token",
      },
    },
  };

  const config = withWindow(
    {
      __COMPANYHELM_CONFIG__: runtimeConfig,
      location: { hostname: "frontend.example.com" } as unknown as Location,
    } as unknown as TestWindow,
    () => loadConfig(),
  );

  assert.equal(config.api.graphqlApiUrl, "https://api.example.com/graphql");
  assert.equal(config.auth.provider, "supabase");
  assert.equal(config.auth.supabase?.url, "https://example.supabase.co");
});

test("runtimeConfigSchema rejects supabase provider without supabase config", () => {
  assert.throws(
    () =>
      runtimeConfigSchema.parse({
        api: {
          graphqlApiUrl: "https://api.example.com/graphql",
          runnerGrpcTarget: "runner.example.com:50051",
        },
        auth: {
          provider: "supabase",
          companyhelm: {
            tokenStorageKey: "companyhelm.auth.token",
          },
        },
      }),
    /Supabase auth provider requires auth\.supabase configuration\./,
  );
});
