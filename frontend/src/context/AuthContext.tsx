import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { decodeJwt } from 'jose';

interface AuthContextType {
  user: any;
  loading: boolean;
  authError: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const exchanging = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && !exchanging.current) {
      exchangeCodeForTokens(code);
    } else if (!code) {
      // No code in URL, try to load existing tokens
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
      console.log('Token exchange response status:', response.status);
      console.log('Token exchange response body:', responseText);

      if (!response.ok) {
        throw new Error(`Token exchange failed (${response.status}): ${responseText}`);
      }

      let tokens;
      try {
        tokens = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Response is not valid JSON (likely HTML error page)');
      }

      if (!tokens.id_token) {
        throw new Error('No id_token in response');
      }

      localStorage.setItem('authTokens', JSON.stringify(tokens));
      const decodedUser = decodeJwt(tokens.id_token);
      setUser(decodedUser);
      // Remove the code from URL
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

  const login = () => {
    const loginUrl = `${import.meta.env.VITE_COGNITO_DOMAIN}/login?` +
      `client_id=${import.meta.env.VITE_CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${import.meta.env.VITE_REDIRECT_URI}&` +
      `scope=email+openid+profile`;
    window.location.href = loginUrl;
  };

  const logout = () => {
    const logoutUrl = `${import.meta.env.VITE_COGNITO_DOMAIN}/logout?` +
      `client_id=${import.meta.env.VITE_CLIENT_ID}&` +
      `logout_uri=${import.meta.env.VITE_LOGOUT_URI}`;
    localStorage.removeItem('authTokens');
    setUser(null);
    window.location.href = logoutUrl;
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};