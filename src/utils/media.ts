export function matchesMediaQuery(query: any) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(query).matches;
}

export function resolveGraphQLWebSocketUrl(rawUrl: any) {
  const cleanUrl = String(rawUrl || "").trim();
  if (!cleanUrl) {
    return "";
  }

  if (cleanUrl.startsWith("ws://") || cleanUrl.startsWith("wss://")) {
    return cleanUrl;
  }

  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    const parsed = new URL(cleanUrl);
    parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    return parsed.toString();
  }

  if (typeof window === "undefined") {
    return cleanUrl;
  }

  const base = new URL(window.location.href);
  const parsed = new URL(cleanUrl, base);
  parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  return parsed.toString();
}
