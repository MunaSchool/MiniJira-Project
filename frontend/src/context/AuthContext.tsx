import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { AuthSession, AuthUser, LoginCredentials } from '@/types/auth';
import { login as loginApi } from '@/services/auth.service';
import { getProfile } from '@/services/user.service';
import { getPostLoginRedirectPath } from '@/lib/auth-utils';
import { decodeJwtPayload } from '@/lib/jwt-decode';
import { clearIdToken, getIdToken, persistIdToken } from '@/lib/tokens';

export interface AuthContextValue {
  user: AuthUser | null;
  profile: AuthUser | null;
  loading: boolean;
  authError: string | null;
  login: (credentials?: LoginCredentials, rememberDevice?: boolean) => Promise<AuthSession | void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  applySession: (session: AuthSession) => void;
  updateSessionUser: (user: AuthSession['user']) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isTokenExpired(token: string): boolean {
  try {
    const claims = decodeJwtPayload(token);
    const exp = claims.exp as number | undefined;
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const exchanging = useRef(false);

  const refreshProfile = useCallback(async () => {
    const token = getIdToken();
    if (!token) return;
    if (isTokenExpired(token)) {
      clearIdToken();
      setUser(null);
      setProfile(null);
      setAuthError('Your session expired. Please sign in again.');
      return;
    }
    try {
      const data = await getProfile();
      setProfile(data);
      setUser(data);
      setAuthError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile load failed';
      console.error('Profile load failed', error);
      setAuthError(message);
      if (message.includes('expired') || message.includes('Invalid or expired token')) {
        clearIdToken();
        setUser(null);
        setProfile(null);
      }
    }
  }, []);

  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const token = getIdToken();
    if (user && token) {
      setSession({
        token,
        role: user.role || 'Employee',
        teamId: user.teamId ?? null,
        user: {
          email: user.email || '',
          name: user.name || user.email || '',
          sub: user.userId || ''
        },
        rememberDevice: true
      });
    } else {
      setSession(null);
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const onCallback = window.location.pathname === '/callback';

    if (code && onCallback && !exchanging.current) {
      void exchangeCodeForTokens(code);
      return;
    }

    if (onCallback && !code) {
      setLoading(false);
      return;
    }

    const token = getIdToken();
    if (token && isTokenExpired(token)) {
      clearIdToken();
      setLoading(false);
      return;
    }
    if (token) {
      refreshProfile().finally(() => setLoading(false));
      return;
    }
    setLoading(false);
  }, [refreshProfile]);

  const exchangeCodeForTokens = async (code: string) => {
    if (exchanging.current) return;
    exchanging.current = true;
    setLoading(true);
    setAuthError(null);

    const tokenUrl = `${import.meta.env.VITE_COGNITO_DOMAIN}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: import.meta.env.VITE_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_REDIRECT_URI,
      code
    });

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal: controller.signal
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`Token exchange failed (${response.status}): ${responseText}`);
      }

      const tokens = JSON.parse(responseText) as { id_token?: string };
      if (!tokens.id_token) {
        throw new Error('No id_token in response');
      }

      persistIdToken(tokens.id_token);
      window.history.replaceState({}, document.title, '/callback');
      await refreshProfile();
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.name === 'AbortError'
          ? 'Sign-in timed out. Check redirect URL (port 5174) and network.'
          : error instanceof Error
            ? error.message
            : 'Sign-in failed';
      console.error('Exchange error:', error);
      setAuthError(message);
      clearIdToken();
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
      exchanging.current = false;
    }
  };

  const login = async (credentials?: LoginCredentials, rememberDevice = false) => {
    if (!credentials) {
      const loginUrl =
        `${import.meta.env.VITE_COGNITO_DOMAIN}/login?` +
        `client_id=${import.meta.env.VITE_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(import.meta.env.VITE_REDIRECT_URI)}&` +
        `scope=email+openid+profile`;
      window.location.href = loginUrl;
      return;
    }

    const response = await loginApi(credentials);
    const session: AuthSession = {
      token: response.token,
      role: response.role,
      teamId: response.teamId ?? null,
      user: {
        email: response.user.email ?? '',
        name: response.user.name ?? response.user.email ?? '',
        sub: (response.user as { sub?: string }).sub ?? response.user.userId ?? ''
      },
      rememberDevice
    };

    persistIdToken(session.token, rememberDevice);
    setSession(session);
    const profileData = await getProfile().catch(() => response.user);
    setProfile(profileData);
    setUser(profileData);
    setAuthError(null);
    return session;
  };

  const logout = () => {
    const logoutUrl =
      `${import.meta.env.VITE_COGNITO_DOMAIN}/logout?` +
      `client_id=${import.meta.env.VITE_CLIENT_ID}&` +
      `logout_uri=${encodeURIComponent(import.meta.env.VITE_LOGOUT_URI)}`;
    clearIdToken();
    setUser(null);
    setProfile(null);
    window.location.href = logoutUrl;
  };

  const applySession = useCallback((newSession: AuthSession) => {
    setSession(newSession);
    persistIdToken(newSession.token, newSession.rememberDevice);
    setUser({
      userId: String(newSession.user.sub ?? newSession.user.userId ?? ''),
      email: newSession.user.email,
      name: newSession.user.name,
      role: newSession.role,
      teamId: newSession.teamId
    });
  }, []);

  const updateSessionUser = useCallback(
    (updatedUser: AuthSession['user']) => {
      if (session) {
        const newSession = { ...session, user: { ...session.user, ...updatedUser } };
        setSession(newSession);
        if (user) {
          setUser({ ...user, email: updatedUser.email, name: updatedUser.name });
        }
      }
    },
    [session, user]
  );

  const token = getIdToken();
  const isAuthenticated = Boolean(user && token && !isTokenExpired(token));

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    authError,
    login,
    logout,
    refreshProfile,
    session,
    isAuthenticated,
    isInitializing: loading,
    applySession,
    updateSessionUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
