import axios from 'axios';
import { api } from './api';
import type { AuthUser } from '@/types/auth';

export interface ProfileUpdatePayload {
  name: string;
  email: string;
}

export async function getProfile(): Promise<AuthUser> {
  try {
    const { data } = await api.get<AuthUser>('/api/users/me');
    return data;
  } catch (error) {
    throw mapProfileError(error);
  }
}

export async function updateProfile(payload: ProfileUpdatePayload): Promise<AuthUser> {
  try {
    const { data } = await api.put<AuthUser>('/api/users/me', {
      name: payload.name.trim(),
      email: payload.email.trim()
    });
    return data;
  } catch (error) {
    throw mapProfileError(error);
  }
}

function mapProfileError(error: unknown): Error {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error('Profile request failed.');
  }

  const status = error.response?.status;
  const message = (error.response?.data as { error?: string })?.error || error.message;

  if (message?.includes('cognito-idp.undefined')) {
    return new Error('Backend is missing COGNITO_REGION or COGNITO_USER_POOL_ID in mini-jira-backend/.env.');
  }

  if (message?.includes('Missing credentials')) {
    return new Error('Backend AWS credentials are missing. Set AWS_ACCESS_KEY_ID/SECRET in mini-jira-backend/.env.');
  }

  if (message?.includes('Invalid or expired token')) {
    return new Error('Your session expired. Please sign in again.');
  }

  if (status === 401 && message?.includes('User not found')) {
    return new Error('User not found in DynamoDB. Add your Cognito userId to the Users table.');
  }

  return new Error(message || 'Profile request failed.');
}
