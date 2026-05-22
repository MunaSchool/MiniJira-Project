import apiClient from './client';

export const getProjects = () => apiClient.get('/projects');
export const createProject = (data: any) => apiClient.post('/projects', data);
export const updateProject = (id: string, data: any) => apiClient.put(`/projects/${id}`, data);
export const deleteProject = (id: string) => apiClient.delete(`/projects/${id}`);
