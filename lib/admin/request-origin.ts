function firstHeaderValue(value: string | null): string | null {
  const first = value?.split(",")[0]?.trim();
  return first || null;
}

export function isSameOriginRequest(headers: Headers, requestUrl: string): boolean {
  const originValue = headers.get("origin");
  if (!originValue) return false;

  try {
    const origin = new URL(originValue);
    const host =
      firstHeaderValue(headers.get("x-forwarded-host")) ??
      firstHeaderValue(headers.get("host"));
    if (!host || origin.host.toLowerCase() !== host.toLowerCase()) return false;

    const forwardedProtocol = firstHeaderValue(headers.get("x-forwarded-proto"));
    const expectedProtocol = forwardedProtocol
      ? `${forwardedProtocol.replace(/:$/, "")}:`
      : origin.protocol === "http:" && host.startsWith("127.0.0.1")
        ? "http:"
        : new URL(requestUrl).protocol;

    return origin.protocol === expectedProtocol;
  } catch {
    return false;
  }
}

export function buildSameOriginUrl(
  pathname: string,
  headers: Headers,
  requestUrl: string,
): URL | null {
  if (!isSameOriginRequest(headers, requestUrl)) return null;
  const origin = headers.get("origin");
  if (!origin || !pathname.startsWith("/") || pathname.startsWith("//")) return null;
  try {
    return new URL(pathname, origin);
  } catch {
    return null;
  }
}
