import { useContext } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AuthContext, type AuthContextValue } from '@/context/AuthContext';
import { getPostLoginRedirectPath } from '@/lib/auth-utils';
import { toast } from '@/hooks/use-toast';
import type { LoginCredentials } from '@/types/auth';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function useLoginMutation() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({
      credentials,
      rememberDevice
    }: {
      credentials: LoginCredentials;
      rememberDevice: boolean;
    }) => {
      const loadingToast = toast({
        title: 'Authenticating...',
        description: 'Verifying your credentials'
      });
      try {
        const session = await login(credentials, rememberDevice);
        loadingToast.dismiss();
        return session;
      } catch (error) {
        loadingToast.dismiss();
        throw error;
      }
    },
    onSuccess: (session) => {
      toast({
        title: 'Login successful',
        description: 'Redirecting to the test welcome page…'
      });
      navigate(getPostLoginRedirectPath(session.role), { replace: true });
    },
    onError: (error: Error) => {
      const isCredentialError =
        error.message.includes('Wrong email') ||
        error.message.includes('Invalid credentials');
      toast({
        variant: 'destructive',
        title: isCredentialError ? 'Invalid credentials' : 'Login failed',
        description: error.message || 'Please check your email and password.'
      });
    }
  });
}
