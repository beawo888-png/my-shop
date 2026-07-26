const EXACT_PUBLIC_PATHS = new Set(["/", "/menu", "/reviews"]);
const PUBLIC_PREFIXES = ["/menu/"];
const FILE_EXTENSION = /\.[a-z0-9]{1,10}$/i;

export function isTrackablePublicRequest(input: {
  method: string;
  pathname: string;
}): boolean {
  if (!new Set(["GET", "HEAD"]).has(input.method.toUpperCase())) return false;
  if (!input.pathname.startsWith("/")) return false;
  if (FILE_EXTENSION.test(input.pathname)) return false;

  return (
    EXACT_PUBLIC_PATHS.has(input.pathname) ||
    PUBLIC_PREFIXES.some((prefix) => input.pathname.startsWith(prefix))
  );
}
