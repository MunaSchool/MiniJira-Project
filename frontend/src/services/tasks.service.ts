import axios from 'axios';
import { api } from '@/services/api';
import type { Task, TaskCreatePayload, TaskFilters, TaskListResponse, TaskUpdatePayload } from '@/types/tasks';

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { error?: string; message?: string } | undefined)?.error ||
      (error.response?.data as { error?: string; message?: string } | undefined)?.message ||
      error.message ||
      fallback
    );
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function getTasks(filters?: TaskFilters): Promise<TaskListResponse> {
  try {
    const { data } = await api.get<TaskListResponse>('/api/tasks', { params: filters });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load tasks.'));
  }
}

export async function getTask(taskId: string): Promise<Task> {
  try {
    const { data } = await api.get<Task>(`/api/tasks/${taskId}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load task details.'));
  }
}

export async function createTask(payload: TaskCreatePayload): Promise<Task> {
  try {
    const { data } = await api.post<Task>('/api/tasks', payload);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to create task.'));
  }
}

export async function updateTask(taskId: string, payload: TaskUpdatePayload): Promise<Task> {
  try {
    const { data } = await api.put<Task>(`/api/tasks/${taskId}`, payload);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to update task.'));
  }
}

export async function updateTaskStatus(taskId: string, status: string): Promise<Task> {
  try {
    const { data } = await api.patch<Task>(`/api/tasks/${taskId}/status`, { status });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to update task status.'));
  }
}

export async function deleteTask(taskId: string): Promise<{ message: string; task: Task }> {
  try {
    const { data } = await api.delete<{ message: string; task: Task }>(`/api/tasks/${taskId}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete task.'));
  }
}
