import { loadSession } from '@/lib/auth-utils';

export function getIdToken(): string | null {
  const raw = localStorage.getItem('authTokens');
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { id_token?: string; idToken?: string };
      return parsed.id_token ?? parsed.idToken ?? null;
    } catch {
      /* ignore */
    }
  }

  return loadSession()?.token ?? null;
}

export function persistIdToken(idToken: string, remember = true): void {
  localStorage.setItem('authTokens', JSON.stringify({ id_token: idToken }));
  if (!remember) return;
}

export function clearIdToken(): void {
  localStorage.removeItem('authTokens');
}
