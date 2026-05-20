export interface IdTokenClaims {
  sub?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

/** Decode JWT payload only (no signature verify). For local test fallback. */
export function decodeJwtPayload(token: string): IdTokenClaims {
  const part = token.split('.')[1];
  if (!part) return {};
  const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(json) as IdTokenClaims;
}
