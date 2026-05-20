import { Navigate } from 'react-router-dom';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { LoginCard } from '@/components/auth/LoginCard';
import { useAuth } from '@/hooks/useAuth';
import { getPostLoginRedirectPath } from '@/lib/auth-utils';

export function LoginPage() {
  const { isAuthenticated, session, isInitializing } = useAuth();

  if (isInitializing) {
    return <div className="flex min-h-screen items-center justify-center bg-background">Loading...</div>;
  }

  if (isAuthenticated && session) {
    return <Navigate to={getPostLoginRedirectPath(session.role)} replace />;
  }

  return (
    <AuthBackground>
      <LoginCard />
    </AuthBackground>
  );
}
