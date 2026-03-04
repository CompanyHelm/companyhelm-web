import assert from "node:assert/strict";
import test from "node:test";
import { executeRelayGraphQL } from "../../src/relay/client.ts";
import { authProvider } from "../../src/auth/runtime.ts";

test("relay signs out when the API responds with HTTP 401", async () => {
  const originalFetch = global.fetch;
  const originalSignOut = authProvider.signOut;
  let signOutCalls = 0;

  try {
    authProvider.signOut = () => {
      signOutCalls += 1;
    };
    global.fetch = (async () => ({
      ok: false,
      status: 401,
      async json() {
        return {
          errors: [
            { message: "Unauthorized." },
          ],
        };
      },
    })) as any;

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
      Reflect.deleteProperty(global as any, "fetch");
    } else {
      global.fetch = originalFetch;
    }
  }
});

test("relay signs out when GraphQL errors include JWT expiration", async () => {
  const originalFetch = global.fetch;
  const originalSignOut = authProvider.signOut;
  let signOutCalls = 0;

  try {
    authProvider.signOut = () => {
      signOutCalls += 1;
    };
    global.fetch = (async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          errors: [
            { message: "JWT is expired." },
          ],
        };
      },
    })) as any;

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
      Reflect.deleteProperty(global as any, "fetch");
    } else {
      global.fetch = originalFetch;
    }
  }
});
