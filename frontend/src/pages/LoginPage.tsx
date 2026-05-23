import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const errorMessages: Record<string, string> = {
  auth_failed:
    'Sign-in failed. Cognito callback must be http://localhost:5174/callback and the app must run on port 5174.',
  session_expired: 'Your session expired. Please sign in again.'
};

export const LoginPage = () => {
  const { login } = useAuth();
  const [params] = useSearchParams();
  const errorHint = useMemo(() => {
    const code = params.get('error');
    return code ? errorMessages[code] ?? 'Please try signing in again.' : null;
  }, [params]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-96 rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Mini Jira</h1>
        {errorHint ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorHint}
          </p>
        ) : null}
        <Button onClick={() => login()} className="w-full">
          Sign in with Cognito
        </Button>
        <p className="mt-4 text-center text-sm text-gray-600">
          New user? Create an account during sign-in.
        </p>
      </div>
    </div>
  );
};
