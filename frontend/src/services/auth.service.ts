import axios from 'axios';
import type { LoginCredentials, LoginResponse, SignupPayload, SignupResponse } from '@/types/auth';
import { api } from './api';

function isCognitoConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_COGNITO_USER_POOL_ID && import.meta.env.VITE_COGNITO_CLIENT_ID
  );
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  if (isCognitoConfigured()) {
    const { loginWithCognito } = await import('./cognito-auth');
    return loginWithCognito(credentials);
  }

  try {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      email: credentials.email.trim(),
      password: credentials.password
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const shouldFallback =
        status === 404 || status === 501 || status === 500 || (status && status >= 500) || !status;

      if (shouldFallback) {
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

export async function register(payload: SignupPayload): Promise<SignupResponse> {
  if (isCognitoConfigured()) {
    const { registerWithCognito } = await import('./cognito-auth');
    return registerWithCognito(payload);
  }

  try {
    const { data } = await api.post<SignupResponse>('/auth/register', {
      name: payload.name.trim(),
      email: payload.email.trim(),
      organizationName: payload.organizationName.trim(),
      password: payload.password
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const shouldFallback =
        status === 404 || status === 501 || status === 500 || (status && status >= 500) || !status;

      if (shouldFallback) {
        if (!isCognitoConfigured()) {
          throw new Error(
            'Registration endpoint unavailable. Set VITE_COGNITO_* in frontend/.env for Cognito auth.'
          );
        }
        const { registerWithCognito } = await import('./cognito-auth');
        return registerWithCognito(payload);
      }

      if (status === 409) {
        throw new Error('An account with this email already exists.');
      }

      const message = (error.response?.data as { error?: string })?.error || error.message;
      throw new Error(message || 'Registration failed');
    }
    throw error;
  }
}
