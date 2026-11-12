// Resolve against the gateway-injected base URI so API paths retain the app’s proxy prefix.
export function apiUrl(path: string): string {
  const base =
    typeof document !== "undefined" && document.baseURI ? document.baseURI : "/";
  return new URL(path.replace(/^\/+/, ""), base).toString();
}
