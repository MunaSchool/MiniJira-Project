import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { decodeJwt } from 'jose';
import type { AuthSession, LoginCredentials } from '@/types/auth';
import { login as loginApi } from '@/services/auth.service';

// --- Types for backward compatibility with old UI ---
// Reuse the shared AuthSession definition from frontend/types/auth.ts

export interface AuthContextValue {
  // New (Cognito Hosted UI)
  user: any;
  loading: boolean;
  authError: string | null;
  login: (credentials?: LoginCredentials, rememberDevice?: boolean) => Promise<AuthSession | void>;
  logout: () => void;
  // Old (compatibility)
  session: AuthSession | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  applySession: (session: AuthSession) => void;
  updateSessionUser: (user: AuthSession['user']) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // New auth state
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const exchanging = useRef(false);

  // Derived session for old components
  const [session, setSession] = useState<AuthSession | null>(null);

  // Update session whenever user (from Cognito) changes
  useEffect(() => {
    if (user) {
      // Build an AuthSession from the Cognito user info
      const newSession: AuthSession = {
        token: localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')!).id_token : '',
        role: user['custom:role'] || 'Employee',
        teamId: user['custom:teamId'] || null,
        user: {
          email: user.email || '',
          name: user.name || user.email || '',
          sub: user.sub || '',
        },
        rememberDevice: true,
      };
      setSession(newSession);
    } else {
      setSession(null);
    }
  }, [user]);

  // Token exchange (same as before)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && !exchanging.current) {
      exchangeCodeForTokens(code);
    } else if (!code) {
      const tokens = localStorage.getItem('authTokens');
      if (tokens) {
        try {
          const parsed = JSON.parse(tokens);
          if (parsed.idToken) {
            setUser(decodeJwt(parsed.idToken));
          }
        } catch (e) {
          console.error('Failed to parse stored tokens', e);
        }
      }
      setLoading(false);
    }
  }, []);

  const exchangeCodeForTokens = async (code: string) => {
    if (exchanging.current) return;
    exchanging.current = true;
    setAuthError(null);

    const tokenUrl = `${import.meta.env.VITE_COGNITO_DOMAIN}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: import.meta.env.VITE_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_REDIRECT_URI,
      code,
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`Token exchange failed (${response.status}): ${responseText}`);
      }

      let tokens;
      try {
        tokens = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Response is not valid JSON');
      }

      if (!tokens.id_token) {
        throw new Error('No id_token in response');
      }

      localStorage.setItem('authTokens', JSON.stringify(tokens));
      const decodedUser = decodeJwt(tokens.id_token);
      setUser(decodedUser);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error: any) {
      console.error('Exchange error:', error);
      setAuthError(error.message);
      localStorage.removeItem('authTokens');
    } finally {
      setLoading(false);
      exchanging.current = false;
    }
  };

  const login = async (credentials?: LoginCredentials, rememberDevice = false) => {
    if (!credentials) {
      const loginUrl = `${import.meta.env.VITE_COGNITO_DOMAIN}/login?` +
        `client_id=${import.meta.env.VITE_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${import.meta.env.VITE_REDIRECT_URI}&` +
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
        sub: (response.user as any).sub ?? response.user.userId ?? ''
      },
      rememberDevice
    };

    if (rememberDevice) {
      localStorage.setItem('authTokens', JSON.stringify({ id_token: session.token }));
    }

    setSession(session);
    setUser({ ...response.user, sub: session.user.sub });
    return session;
  };

  const logout = () => {
    const logoutUrl = `${import.meta.env.VITE_COGNITO_DOMAIN}/logout?` +
      `client_id=${import.meta.env.VITE_CLIENT_ID}&` +
      `logout_uri=${import.meta.env.VITE_LOGOUT_URI}`;
    localStorage.removeItem('authTokens');
    setUser(null);
    window.location.href = logoutUrl;
  };

  // Compatibility functions (no‑op or localStorage based)
  const applySession = useCallback((newSession: AuthSession) => {
    setSession(newSession);
    if (newSession.rememberDevice) {
      localStorage.setItem('authTokens', JSON.stringify({ id_token: newSession.token }));
    }
    setUser({ ...newSession.user, sub: newSession.user.sub });
  }, []);

  const updateSessionUser = useCallback((updatedUser: AuthSession['user']) => {
    if (session) {
      const newSession = { ...session, user: { ...session.user, ...updatedUser } };
      setSession(newSession);
      // Optionally also update the user state if needed
      if (user) {
        setUser({ ...user, email: updatedUser.email, name: updatedUser.name });
      }
    }
  }, [session, user]);

  const isAuthenticated = Boolean(session?.token);
  const isInitializing = loading;

  const value: AuthContextValue = {
    user,
    loading,
    authError,
    login,
    logout,
    session,
    isAuthenticated,
    isInitializing,
    applySession,
    updateSessionUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};