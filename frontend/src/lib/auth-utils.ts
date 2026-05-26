import type { AuthSession } from '@/types/auth';

export const AUTH_STORAGE_KEYS = {
  token: 'mini_jira_token',
  role: 'mini_jira_role',
  teamId: 'mini_jira_team_id',
  user: 'mini_jira_user',
  remember: 'mini_jira_remember_device',
  pkceVerifier: 'mini_jira_pkce_verifier'
} as const;

export function getAuthStorage(rememberDevice: boolean): Storage {
  return rememberDevice ? localStorage : sessionStorage;
}

export function normalizeRole(role: string): 'manager' | 'employee' | null {
  const value = role?.trim().toLowerCase();
  if (value === 'manager') return 'manager';
  if (value === 'employee') return 'employee';
  return null;
}

export function getPostLoginPath(_role: string): string {
  return '/dashboard';
}

export function getPostLoginRedirectPath(role: string): string {
  return getPostLoginPath(role);
}

function readEnvValue(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

export function getCognitoDomain(): string {
  return readEnvValue(import.meta.env.VITE_COGNITO_DOMAIN, '');
}

export function getCognitoClientId(): string {
  return readEnvValue(import.meta.env.VITE_COGNITO_CLIENT_ID, '');
}

export function getCognitoRedirectUri(): string {
  return readEnvValue(
    import.meta.env.VITE_COGNITO_REDIRECT_URI,
    `${window.location.origin}/callback`
  );
}

export function getCognitoLogoutUri(): string {
  return readEnvValue(
    import.meta.env.VITE_COGNITO_LOGOUT_URI,
    `${window.location.origin}/login`
  );
}

function base64UrlEncode(bytes: Uint8Array): string {
  let base64 = '';
  bytes.forEach((byte) => {
    base64 += String.fromCharCode(byte);
  });
  return btoa(base64).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function sha256(value: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
}

export async function generatePkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
  const challengeBytes = await sha256(verifier);
  return { verifier, challenge: base64UrlEncode(challengeBytes) };
}

export function setPkceVerifier(verifier: string): void {
  sessionStorage.setItem(AUTH_STORAGE_KEYS.pkceVerifier, verifier);
}

export function getPkceVerifier(): string | null {
  return sessionStorage.getItem(AUTH_STORAGE_KEYS.pkceVerifier);
}

export function clearPkceVerifier(): void {
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.pkceVerifier);
}

export function buildCognitoLoginUrl(): string {
  const domain = getCognitoDomain();
  const clientId = getCognitoClientId();
  const redirectUri = getCognitoRedirectUri();

  if (!domain || !clientId) {
    throw new Error('Cognito Hosted UI is not configured. Set VITE_COGNITO_DOMAIN and VITE_COGNITO_CLIENT_ID.');
  }

  const url = new URL('/oauth2/authorize', domain);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'email openid profile');
  return url.toString();
}

export function buildCognitoLogoutUrl(): string {
  const domain = getCognitoDomain();
  const clientId = getCognitoClientId();
  const logoutUri = getCognitoLogoutUri();

  if (!domain || !clientId) {
    throw new Error('Cognito Hosted UI is not configured. Set VITE_COGNITO_DOMAIN and VITE_COGNITO_CLIENT_ID.');
  }

  const url = new URL('/logout', domain);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('logout_uri', logoutUri);
  return url.toString();
}

export function persistSession(session: AuthSession): void {
  const storage = getAuthStorage(session.rememberDevice);
  storage.setItem(AUTH_STORAGE_KEYS.token, session.token);
  storage.setItem(AUTH_STORAGE_KEYS.role, session.role);
  storage.setItem(AUTH_STORAGE_KEYS.teamId, session.teamId ?? '');
  storage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(session.user));
  localStorage.setItem(AUTH_STORAGE_KEYS.remember, session.rememberDevice ? 'true' : 'false');

  const other = session.rememberDevice ? sessionStorage : localStorage;
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => {
    if (key !== AUTH_STORAGE_KEYS.remember) other.removeItem(key);
  });
}

export function loadSession(): AuthSession | null {
  const remember = localStorage.getItem(AUTH_STORAGE_KEYS.remember) === 'true';
  const storage = getAuthStorage(remember);
  const token = storage.getItem(AUTH_STORAGE_KEYS.token);
  if (!token) return null;

  const role = storage.getItem(AUTH_STORAGE_KEYS.role);
  const teamId = storage.getItem(AUTH_STORAGE_KEYS.teamId);
  const userRaw = storage.getItem(AUTH_STORAGE_KEYS.user);
  if (!role || !userRaw) return null;

  try {
    return {
      token,
      role,
      teamId: teamId || null,
      user: JSON.parse(userRaw) as AuthSession['user'],
      rememberDevice: remember
    };
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  [localStorage, sessionStorage].forEach((storage) => {
    Object.values(AUTH_STORAGE_KEYS).forEach((key) => storage.removeItem(key));
  });
}
