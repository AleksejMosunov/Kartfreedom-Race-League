const CSRF_COOKIE_NAME = "kartfreedom_csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (rawName !== name) continue;
    const value = rawValue.join("=");
    return decodeURIComponent(value);
  }

  return null;
}

function withCsrfHeader(init: RequestInit = {}): RequestInit {
  const method = (init.method ?? "GET").toUpperCase();
  if (SAFE_METHODS.has(method)) {
    return init;
  }

  const token = getCookieValue(CSRF_COOKIE_NAME);
  if (!token) {
    return init;
  }

  const headers = new Headers(init.headers ?? undefined);
  if (!headers.has(CSRF_HEADER_NAME)) {
    headers.set(CSRF_HEADER_NAME, token);
  }

  return {
    ...init,
    headers,
  };
}

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, withCsrfHeader(init));
}
