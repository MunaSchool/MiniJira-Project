import axios from 'axios';
import type { LoginCredentials, LoginResponse } from '@/types/auth';
import { api } from './api';

function isCognitoConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_COGNITO_USER_POOL_ID && import.meta.env.VITE_COGNITO_CLIENT_ID
  );
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      email: credentials.email.trim(),
      password: credentials.password
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (status === 404 || status === 501) {
        if (!isCognitoConfigured()) {
          throw new Error(
            'Login endpoint unavailable. Set VITE_COGNITO_* in frontend/.env for Cognito auth.'
          );
        }
        const { loginWithCognito } = await import('./cognito-auth');
        return loginWithCognito(credentials);
      }

      if (status === 401 || status === 403) {
        throw new Error('Invalid credentials');
      }

      const message = (error.response?.data as { error?: string })?.error || error.message;
      throw new Error(message || 'Authentication failed');
    }
    throw error;
  }
}
