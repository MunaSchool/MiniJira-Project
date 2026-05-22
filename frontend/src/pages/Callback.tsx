// src/pages/Callback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Callback = () => {
  const { user, loading, authError } = useAuth(); // we'll add authError to context
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate('/', { replace: true });
      } else if (authError) {
        console.error('Auth error:', authError);
        // Optionally redirect to login with error message
        navigate('/?error=auth_failed', { replace: true });
      }
    }
  }, [user, loading, authError, navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2">Completing sign in...</p>
      </div>
    </div>
  );
};