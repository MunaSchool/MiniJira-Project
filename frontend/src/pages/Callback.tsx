import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getPostLoginRedirectPath } from '@/lib/auth-utils';

export const Callback = () => {
  const { user, loading, authError } = useAuth();
  const navigate = useNavigate();
  const timedOut = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (loading && !user && !authError) {
        timedOut.current = true;
        navigate('/login?error=auth_failed', { replace: true });
      }
    }, 20000);
    return () => window.clearTimeout(timer);
  }, [loading, user, authError, navigate]);

  useEffect(() => {
    if (loading || timedOut.current) return;
    if (user) {
      navigate(getPostLoginRedirectPath(''), { replace: true });
      return;
    }
    if (authError) {
      navigate('/login?error=auth_failed', { replace: true });
    }
  }, [user, loading, authError, navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#eef2f7]">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-slate-900" />
        <p className="mt-2 text-slate-700">Completing sign in…</p>
        {authError ? (
          <p className="mt-2 max-w-md text-sm text-red-600">{authError}</p>
        ) : null}
      </div>
    </div>
  );
};
