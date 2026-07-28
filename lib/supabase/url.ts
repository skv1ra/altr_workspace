/**
 * Supabase clients expect the project origin, not a REST or Auth endpoint.
 * Keep this defensive because environment variables can be copied from an
 * endpoint shown in the dashboard instead of from the project's base URL.
 */
export function normalizeSupabaseProjectUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return value.replace(/\/+(?:rest|auth)\/v1\/?$/i, "").replace(/\/+$/, "");
  }
}
