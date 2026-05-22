import apiClient from './client';

export const getComments = (taskId: string) => apiClient.get(`/comments?taskId=${taskId}`);
export const createComment = (data: any) => apiClient.post('/comments', data);
