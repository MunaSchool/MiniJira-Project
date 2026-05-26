import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPostLoginRedirectPath } from '@/lib/auth-utils';

export const Callback = () => {
  const { completeLogin, loading, authError, session } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      setErrorMessage('Missing authorization code from Cognito.');
      return;
    }

    hasStarted.current = true;

    completeLogin(code)
      .then((nextSession) => {
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate(getPostLoginRedirectPath(nextSession.role), { replace: true });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Auth callback failed';
        setErrorMessage(message);
        navigate('/login', { replace: true, state: { error: message } });
      });
  }, [completeLogin, navigate]);

  useEffect(() => {
    if (!loading && session) {
      navigate(getPostLoginRedirectPath(session.role), { replace: true });
    }
  }, [loading, navigate, session]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2">Completing sign in...</p>
        {authError || errorMessage ? <p className="mt-2 text-sm text-red-600">{authError || errorMessage}</p> : null}
      </div>
    </div>
  );
};