import assert from "node:assert/strict";
import test from "node:test";
import { executeRelayGraphQL } from "../../src/relay/client.ts";
import { authProvider } from "../../src/auth/runtime.ts";

type GlobalWithFetch = typeof global & { fetch?: typeof fetch };
const testGlobal = global as GlobalWithFetch;

function createMockResponse(payload: unknown, status: number, ok: boolean): Response {
  return {
    ok,
    status,
    async json() {
      return payload;
    },
  } as unknown as Response;
}

test("relay signs out when the API responds with HTTP 401", async () => {
  const originalFetch = testGlobal.fetch;
  const originalSignOut = authProvider.signOut;
  let signOutCalls = 0;

  try {
    authProvider.signOut = () => {
      signOutCalls += 1;
    };
    testGlobal.fetch = (async () => createMockResponse({
      errors: [
        { message: "Unauthorized." },
      ],
    }, 401, false)) as typeof fetch;

    await assert.rejects(
      executeRelayGraphQL({
        query: "query RelayAuthExpiry401 { me { id } }",
        force: true,
      }),
      /Unauthorized\./,
    );
    assert.equal(signOutCalls, 1);
  } finally {
    authProvider.signOut = originalSignOut;
    if (typeof originalFetch === "undefined") {
      Reflect.deleteProperty(testGlobal, "fetch");
    } else {
      testGlobal.fetch = originalFetch;
    }
  }
});

test("relay signs out when GraphQL errors include JWT expiration", async () => {
  const originalFetch = testGlobal.fetch;
  const originalSignOut = authProvider.signOut;
  let signOutCalls = 0;

  try {
    authProvider.signOut = () => {
      signOutCalls += 1;
    };
    testGlobal.fetch = (async () => createMockResponse({
      errors: [
        { message: "JWT is expired." },
      ],
    }, 200, true)) as typeof fetch;

    await assert.rejects(
      executeRelayGraphQL({
        query: "query RelayAuthExpiryJwt { me { id } }",
        force: true,
      }),
      /JWT is expired\./,
    );
    assert.equal(signOutCalls, 1);
  } finally {
    authProvider.signOut = originalSignOut;
    if (typeof originalFetch === "undefined") {
      Reflect.deleteProperty(testGlobal, "fetch");
    } else {
      testGlobal.fetch = originalFetch;
    }
  }
});
