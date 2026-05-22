import apiClient from './client';

export const getPresignedUrl = (fileName: string, fileType: string) => 
  apiClient.post('/uploads/presigned-url', { fileName, fileType });
export const deleteImage = (key: string) => apiClient.delete(`/uploads/${key}`);
