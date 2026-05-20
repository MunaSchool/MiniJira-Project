import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand
} from '@aws-sdk/client-cognito-identity-provider';
import axios from 'axios';
import type { LoginCredentials, LoginResponse } from '@/types/auth';
import { decodeJwtPayload } from '@/lib/jwt-decode';
import { api } from './api';

function getCognitoConfig() {
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  const region = import.meta.env.VITE_COGNITO_REGION || 'eu-north-1';
  if (!clientId) return null;
  return { clientId, region };
}

function mapCognitoError(error: unknown): Error {
  const name = (error as { name?: string })?.name ?? '';
  const message = (error as { message?: string })?.message ?? 'Authentication failed';

  if (name === 'NotAuthorizedException' || name === 'UserNotFoundException') {
    return new Error('Wrong email or password.');
  }
  if (message.includes('USER_PASSWORD_AUTH is not enabled')) {
    return new Error(
      'USER_PASSWORD_AUTH is not enabled for this Cognito app client. Enable it in AWS Console → Cognito → App client → Authentication flows.'
    );
  }
  return new Error(message);
}

function mapProfileError(error: unknown, idToken: string, email: string): LoginResponse {
  if (!axios.isAxiosError(error)) {
    throw error;
  }

  const status = error.response?.status;
  const apiError = (error.response?.data as { error?: string })?.error;

  if (import.meta.env.VITE_AUTH_SKIP_PROFILE === 'true' && status === 401) {
    const claims = decodeJwtPayload(idToken);
    return {
      token: idToken,
      role: 'Employee',
      teamId: null,
      user: {
        userId: claims.sub,
        email: claims.email ?? email,
        name: claims.name
      }
    };
  }

  if (status === 401) {
    if (apiError?.includes('DynamoDB') || apiError?.includes('User not found')) {
      throw new Error(
        'Cognito sign-in succeeded, but your user is missing from the DynamoDB Users table. Ask your team to add your userId (Cognito sub) to the database.'
      );
    }
    if (apiError?.includes('Invalid or expired token')) {
      throw new Error(
        'Cognito token was rejected by the API. Check that frontend and backend use the same COGNITO_CLIENT_ID and User Pool.'
      );
    }
    throw new Error(apiError || 'API rejected your session (401). Is the backend running on port 3000?');
  }

  if (status === 404) {
    throw new Error('Profile endpoint not found. Start mini-jira-backend with npm run dev.');
  }

  throw new Error(apiError || error.message || 'Could not load your profile after login.');
}

async function authenticateWithCognito(credentials: LoginCredentials): Promise<string> {
  const config = getCognitoConfig();
  if (!config) {
    throw new Error('Cognito is not configured. Set VITE_COGNITO_CLIENT_ID in frontend/.env');
  }

  const client = new CognitoIdentityProviderClient({ region: config.region });

  try {
    const result = await client.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: config.clientId,
        AuthParameters: {
          USERNAME: credentials.email.trim(),
          PASSWORD: credentials.password
        }
      })
    );

    if (result.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      throw new Error('A new password is required. Complete setup in Cognito first.');
    }

    const idToken = result.AuthenticationResult?.IdToken;
    if (!idToken) {
      throw new Error('No ID token returned from Cognito');
    }

    return idToken;
  } catch (error) {
    throw mapCognitoError(error);
  }
}

export async function loginWithCognito(credentials: LoginCredentials): Promise<LoginResponse> {
  const idToken = await authenticateWithCognito(credentials);
  const email = credentials.email.trim();

  try {
    const { data: profile } = await api.get<LoginResponse['user']>('/api/users/profile', {
      headers: { Authorization: `Bearer ${idToken}` }
    });

    return {
      token: idToken,
      role: String(profile.role ?? ''),
      teamId: (profile.teamId as string | null) ?? null,
      user: profile
    };
  } catch (error) {
    return mapProfileError(error, idToken, email);
  }
}

export function isCognitoConfigured(): boolean {
  return Boolean(import.meta.env.VITE_COGNITO_CLIENT_ID);
}
