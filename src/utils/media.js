export function matchesMediaQuery(query) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(query).matches;
}

export function resolveGraphQLWebSocketUrl(rawUrl) {
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

  if (cleanUrl.startsWith("/") && String(window.location.port || "") === "5173") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.hostname}:4000${cleanUrl}`;
  }

  const base = new URL(window.location.href);
  const parsed = new URL(cleanUrl, base);
  parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  return parsed.toString();
}
