import apiClient from './client';

export const getTasks = () => apiClient.get('/tasks');
export const createTask = (data: any) => apiClient.post('/tasks', data);
export const updateTaskStatus = (taskId: string, status: string) => apiClient.patch(`/tasks/${taskId}/status`, { status });
export const updateTask = (taskId: string, data: any) => apiClient.put(`/tasks/${taskId}`, data);
export const deleteTask = (taskId: string) => apiClient.delete(`/tasks/${taskId}`);
