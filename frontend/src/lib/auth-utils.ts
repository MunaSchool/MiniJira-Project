import type { AuthSession } from '@/types/auth';

export const AUTH_STORAGE_KEYS = {
  token: 'mini_jira_token',
  role: 'mini_jira_role',
  teamId: 'mini_jira_team_id',
  user: 'mini_jira_user',
  remember: 'mini_jira_remember_device'
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
