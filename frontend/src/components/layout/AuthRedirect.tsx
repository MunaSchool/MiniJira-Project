import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getPostLoginRedirectPath } from '@/lib/auth-utils';

export function AuthRedirect() {
  const { isAuthenticated, isInitializing, session } = useAuth();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getPostLoginRedirectPath(session?.role ?? '')} replace />;
}
