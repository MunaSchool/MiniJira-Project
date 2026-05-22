import { useContext } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AuthContext, type AuthContextValue } from '@/context/AuthContext';
import { getPostLoginRedirectPath } from '@/lib/auth-utils';
import { toast } from '@/hooks/use-toast';
import type { LoginCredentials, SignupPayload } from '@/types/auth';
import { register } from '@/services/auth.service';

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
        description: 'Redirecting to your workspace…'
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

export function useSignupMutation() {
  const { applySession } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ payload }: { payload: SignupPayload }) => {
      const loadingToast = toast({
        title: 'Authenticating...',
        description: 'Creating your account'
      });
      try {
        const response = await register(payload);
        loadingToast.dismiss();
        return response;
      } catch (error) {
        loadingToast.dismiss();
        throw error;
      }
    },
    onSuccess: (response, variables) => {
      if (response?.token && response?.role && response?.user) {
        const session = {
          token: response.token,
          role: response.role,
          teamId: response.teamId ?? null,
          user: response.user,
          rememberDevice: true
        };
        applySession(session);
        toast({
          title: 'Logged in successfully',
          description: 'Redirecting to your workspace.'
        });
        navigate(getPostLoginRedirectPath(session.role), { replace: true });
        return;
      }

      toast({
        title: 'Account created',
        description: response?.message || 'You can now sign in with your new credentials.'
      });
      navigate('/login', { replace: true, state: { email: variables.payload.email } });
    },
    onError: (error: Error) => {
      const isDuplicate =
        error.message.includes('already exists') ||
        error.message.includes('Duplicate') ||
        error.message.includes('Conflict');
      toast({
        variant: 'destructive',
        title: isDuplicate ? 'Account already exists' : 'Sign up failed',
        description: error.message || 'Please review your details and try again.'
      });
    }
  });
}
