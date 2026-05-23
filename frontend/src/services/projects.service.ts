import axios from 'axios';
import { api } from './api';

export interface Project {
  projectId: string;
  name: string;
  description?: string;
  teamId: string;
  deadline?: string;
  managerId?: string;
  createdAt?: string;
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

export async function getProjects(teamId?: string): Promise<Project[]> {
  try {
    const { data } = await api.get<Project[]>('/api/projects', {
      params: teamId ? { teamId } : undefined
    });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load projects.'));
  }
}

export async function getProject(projectId: string): Promise<Project> {
  try {
    const { data } = await api.get<Project>(`/api/projects/${projectId}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load project.'));
  }
}

export async function createProject(payload: {
  name: string;
  description?: string;
  teamId: string;
  deadline?: string;
}): Promise<Project> {
  try {
    const { data } = await api.post<Project>('/api/projects', payload);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to create project.'));
  }
}

export async function updateProject(
  projectId: string,
  payload: Partial<Pick<Project, 'name' | 'description' | 'teamId' | 'deadline'>>
): Promise<Project> {
  try {
    const { data } = await api.put<Project>(`/api/projects/${projectId}`, payload);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to update project.'));
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  try {
    await api.delete(`/api/projects/${projectId}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete project.'));
  }
}
