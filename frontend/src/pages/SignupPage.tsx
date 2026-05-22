import { AuthBackground } from '@/components/auth/AuthBackground';
import { SignupCard } from '@/components/auth/SignupCard';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { getPostLoginRedirectPath } from '@/lib/auth-utils';

export function SignupPage() {
  const { isAuthenticated, session, isInitializing } = useAuth();

  if (isInitializing) {
    return <div className="flex min-h-screen items-center justify-center bg-background">Loading...</div>;
  }

  if (isAuthenticated && session) {
    return <Navigate to={getPostLoginRedirectPath(session.role)} replace />;
  }

  return (
    <AuthBackground>
      <SignupCard />
    </AuthBackground>
  );
}
