import { GRAPHQL_URL } from "./constants.ts";

export function resolveAgentApiDocsUrl(baseUrl: string = typeof window !== "undefined" ? window.location.origin : "http://localhost") {
  try {
    const parsed = new URL(GRAPHQL_URL || "/graphql", baseUrl);
    parsed.pathname = "/agent/v1/docs";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "/agent/v1/docs";
  }
}
