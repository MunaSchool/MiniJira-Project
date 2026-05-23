import axios from 'axios';
import { api } from './api';
import type { AuthUser } from '@/types/auth';

export interface TeamUser extends AuthUser {
  userId: string;
  name?: string;
  email?: string;
  role?: string;
  teamId?: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { error?: string })?.error ||
      error.message ||
      fallback
    );
  }
  return error instanceof Error ? error.message : fallback;
}

export async function getUsersByTeam(teamId: string): Promise<TeamUser[]> {
  try {
    const { data } = await api.get<TeamUser[]>('/api/users', { params: { teamId } });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load team members.'));
  }
}

export { getProfile, updateProfile } from './user.service';
