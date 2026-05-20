import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import type { AuthSession, LoginCredentials } from '@/types/auth';
import { clearSession, loadSession, persistSession } from '@/lib/auth-utils';
import { login as loginRequest } from '@/services/auth.service';

export interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (credentials: LoginCredentials, rememberDevice: boolean) => Promise<AuthSession>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    setSession(loadSession());
    setIsInitializing(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials, rememberDevice: boolean) => {
    const response = await loginRequest(credentials);
    const nextSession: AuthSession = {
      token: response.token,
      role: response.role,
      teamId: response.teamId,
      user: response.user,
      rememberDevice
    };
    persistSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.token),
      isInitializing,
      login,
      logout
    }),
    [session, isInitializing, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
