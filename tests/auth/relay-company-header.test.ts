import assert from "node:assert/strict";
import test from "node:test";
import { executeRelayGraphQL } from "../../src/relay/client.ts";
import { setActiveCompanyId } from "../../src/utils/company-context.ts";

type GlobalWithFetch = typeof global & { fetch?: typeof fetch };
const testGlobal = global as GlobalWithFetch;

function createMockResponse(payload: unknown, status = 200, ok = true): Response {
  return {
    ok,
    status,
    async json() {
      return payload;
    },
  } as unknown as Response;
}

test("relay omits x-company-id for companies directory query", async () => {
  const originalFetch = testGlobal.fetch;
  const fetchCalls: Array<{ url: RequestInfo | URL; options?: RequestInit }> = [];

  try {
    setActiveCompanyId("company-123");
    testGlobal.fetch = (async (url: RequestInfo | URL, options?: RequestInit) => {
      fetchCalls.push({ url, options });
      return createMockResponse({
        data: {
          companies: {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      });
    }) as typeof fetch;

    await executeRelayGraphQL({
      query: `
        query CompanyApiListCompanies($first: Int!, $after: String) {
          companies(first: $first, after: $after) {
            edges {
              node {
                id
                name
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `,
      variables: { first: 20, after: null },
      force: true,
    });

    const headers = fetchCalls[0]?.options?.headers as Record<string, string> | undefined;
    assert.equal(headers?.["x-company-id"], undefined);
  } finally {
    setActiveCompanyId("");
    if (typeof originalFetch === "undefined") {
      Reflect.deleteProperty(testGlobal, "fetch");
    } else {
      testGlobal.fetch = originalFetch;
    }
  }
});

test("relay omits x-company-id for company by id query", async () => {
  const originalFetch = testGlobal.fetch;
  const fetchCalls: Array<{ url: RequestInfo | URL; options?: RequestInit }> = [];

  try {
    setActiveCompanyId("company-123");
    testGlobal.fetch = (async (url: RequestInfo | URL, options?: RequestInit) => {
      fetchCalls.push({ url, options });
      return createMockResponse({
        data: {
          company: {
            id: "company-123",
            name: "Acme",
          },
        },
      });
    }) as typeof fetch;

    await executeRelayGraphQL({
      query: `
        query CompanyApiGetCompany($id: ID!) {
          company(id: $id) {
            id
            name
          }
        }
      `,
      variables: { id: "company-123" },
      force: true,
    });

    const headers = fetchCalls[0]?.options?.headers as Record<string, string> | undefined;
    assert.equal(headers?.["x-company-id"], undefined);
  } finally {
    setActiveCompanyId("");
    if (typeof originalFetch === "undefined") {
      Reflect.deleteProperty(testGlobal, "fetch");
    } else {
      testGlobal.fetch = originalFetch;
    }
  }
});

test("relay sends x-company-id for scoped queries", async () => {
  const originalFetch = testGlobal.fetch;
  const fetchCalls: Array<{ url: RequestInfo | URL; options?: RequestInit }> = [];

  try {
    setActiveCompanyId("company-123");
    testGlobal.fetch = (async (url: RequestInfo | URL, options?: RequestInit) => {
      fetchCalls.push({ url, options });
      return createMockResponse({
        data: {
          me: {
            id: "user-1",
          },
        },
      });
    }) as typeof fetch;

    await executeRelayGraphQL({
      query: `
        query RelayScopedMe {
          me {
            id
          }
        }
      `,
      force: true,
    });

    const headers = fetchCalls[0]?.options?.headers as Record<string, string> | undefined;
    assert.equal(headers?.["x-company-id"], "company-123");
  } finally {
    setActiveCompanyId("");
    if (typeof originalFetch === "undefined") {
      Reflect.deleteProperty(testGlobal, "fetch");
    } else {
      testGlobal.fetch = originalFetch;
    }
  }
});

test("relay query cache is scoped by active company id for company-scoped queries", async () => {
  const originalFetch = testGlobal.fetch;
  const fetchCalls: Array<{ url: RequestInfo | URL; options?: RequestInit }> = [];

  try {
    testGlobal.fetch = (async (url: RequestInfo | URL, options?: RequestInit) => {
      fetchCalls.push({ url, options });
      const headers = options?.headers as Record<string, string> | undefined;
      const scopedCompanyId = headers?.["x-company-id"] || "";
      return createMockResponse({
        data: {
          me: {
            id: scopedCompanyId || "missing-company",
          },
        },
      });
    }) as typeof fetch;

    setActiveCompanyId("company-1");
    const firstPayload = await executeRelayGraphQL({
      query: `
        query RelayScopedCacheMe {
          me {
            id
          }
        }
      `,
    });

    setActiveCompanyId("company-2");
    const secondPayload = await executeRelayGraphQL({
      query: `
        query RelayScopedCacheMe {
          me {
            id
          }
        }
      `,
    });

    assert.equal(fetchCalls.length, 2);
    assert.equal(
      (fetchCalls[0]?.options?.headers as Record<string, string> | undefined)?.["x-company-id"],
      "company-1",
    );
    assert.equal(
      (fetchCalls[1]?.options?.headers as Record<string, string> | undefined)?.["x-company-id"],
      "company-2",
    );
    assert.deepEqual(firstPayload, {
      me: {
        id: "company-1",
      },
    });
    assert.deepEqual(secondPayload, {
      me: {
        id: "company-2",
      },
    });
  } finally {
    setActiveCompanyId("");
    if (typeof originalFetch === "undefined") {
      Reflect.deleteProperty(testGlobal, "fetch");
    } else {
      testGlobal.fetch = originalFetch;
    }
  }
});
