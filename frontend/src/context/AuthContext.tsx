import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { decodeJwtPayload } from '@/lib/jwt-decode';
import { api } from '@/services/api';
import {
  buildCognitoLoginUrl,
  buildCognitoLogoutUrl,
  clearSession,
  clearPkceVerifier,
  generatePkcePair,
  getCognitoClientId,
  getCognitoDomain,
  getCognitoRedirectUri,
  getPkceVerifier,
  loadSession,
  setPkceVerifier,
  persistSession
} from '@/lib/auth-utils';
import type { AuthSession, AuthUser } from '@/types/auth';

export interface AuthContextValue {
  user: AuthSession['user'] | null;
  loading: boolean;
  authError: string | null;
  login: () => void;
  completeLogin: (code: string) => Promise<AuthSession>;
  logout: () => void;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  applySession: (session: AuthSession) => void;
  updateSessionUser: (user: AuthSession['user']) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthSession['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const storedSession = loadSession();
    if (storedSession) {
      setSession(storedSession);
      setUser(storedSession.user);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async () => {
    const { verifier, challenge } = await generatePkcePair();
    setPkceVerifier(verifier);
    const loginUrl = new URL(buildCognitoLoginUrl());
    loginUrl.searchParams.set('code_challenge_method', 'S256');
    loginUrl.searchParams.set('code_challenge', challenge);
    window.location.href = loginUrl.toString();
  }, []);

  const completeLogin = useCallback(async (code: string) => {
    setAuthError(null);
    setLoading(true);

    try {
      const tokenEndpoint = new URL('/oauth2/token', getCognitoDomain()).toString();
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: getCognitoClientId(),
        redirect_uri: getCognitoRedirectUri(),
        code,
        code_verifier: getPkceVerifier() || ''
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`Cognito token exchange failed (${response.status}): ${responseText}`);
      }

      const tokens = JSON.parse(responseText) as { id_token?: string };
      if (!tokens.id_token) {
        throw new Error('Cognito did not return an ID token.');
      }

      const claims = decodeJwtPayload(tokens.id_token);
      let profile: AuthUser = {
        userId: claims.sub,
        email: claims.email,
        name: claims.name,
        role: claims['custom:role'] as string | undefined,
        teamId: claims['custom:teamId'] as string | null | undefined
      };

      try {
        const { data } = await api.get<AuthUser>('/api/users/profile', {
          headers: { Authorization: `Bearer ${tokens.id_token}` }
        });
        profile = data;
      } catch (error) {
        if (!shouldSkipProfileError(error)) {
          throw error;
        }
      }

      const nextSession: AuthSession = {
        token: tokens.id_token,
        role: String(profile.role || claims['custom:role'] || 'Employee'),
        teamId: profile.teamId ?? (claims['custom:teamId'] as string | null | undefined) ?? null,
        user: {
          ...profile,
          userId: profile.userId || claims.sub,
          email: profile.email || claims.email,
          name: profile.name || claims.name || profile.email || claims.email || ''
        },
        rememberDevice: true
      };

      persistSession(nextSession);
      clearPkceVerifier();
      setSession(nextSession);
      setUser(nextSession.user);
      return nextSession;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    clearSession();
    clearPkceVerifier();
    setUser(null);
    setSession(null);
    window.location.href = buildCognitoLogoutUrl();
  };

  const applySession = useCallback((newSession: AuthSession) => {
    persistSession(newSession);
    setSession(newSession);
    setUser(newSession.user);
  }, []);

  const updateSessionUser = useCallback((updatedUser: AuthSession['user']) => {
    if (!session) {
      return;
    }

    const nextSession = { ...session, user: { ...session.user, ...updatedUser } };
    persistSession(nextSession);
    setSession(nextSession);
    setUser(nextSession.user);
  }, [session]);

  const value: AuthContextValue = {
    user,
    loading,
    authError,
    login,
    completeLogin,
    logout,
    session,
    isAuthenticated: Boolean(session?.token),
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

function shouldSkipProfileError(error: unknown): boolean {
  if (import.meta.env.VITE_AUTH_SKIP_PROFILE !== 'true') {
    return false;
  }

  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  const message = (error.response?.data as { error?: string })?.error || error.message;
  return status === 401 || message.includes('User not found') || message.includes('Invalid or expired token');
}