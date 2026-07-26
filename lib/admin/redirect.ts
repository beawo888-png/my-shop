const CANONICAL_DASHBOARD = "/admin/ai-visits" as const;
const MALFORMED_ADMIN_PATHS = new Set([
  "/admin/ai-visits%22",
  '/admin/ai-visits"',
  "/admin/ai-visit",
]);

export function sanitizeAdminNext(value: string | null): typeof CANONICAL_DASHBOARD {
  if (!value) return CANONICAL_DASHBOARD;
  try {
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return CANONICAL_DASHBOARD;
    if (value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f]/.test(value)) {
      return CANONICAL_DASHBOARD;
    }
    const decoded = decodeURIComponent(value);
    return decoded === CANONICAL_DASHBOARD
      ? CANONICAL_DASHBOARD
      : CANONICAL_DASHBOARD;
  } catch {
    return CANONICAL_DASHBOARD;
  }
}

export function canonicalizeAdminPath(pathname: string): string | null {
  if (MALFORMED_ADMIN_PATHS.has(pathname)) return CANONICAL_DASHBOARD;
  try {
    return decodeURIComponent(pathname) === `${CANONICAL_DASHBOARD}"`
      ? CANONICAL_DASHBOARD
      : null;
  } catch {
    return null;
  }
}
