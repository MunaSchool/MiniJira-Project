import axios from 'axios';
import { api } from './api';

export interface PresignedUpload {
  uploadUrl: string;
  key: string;
  imageUrl: string;
  resizedImageUrl?: string;
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

export async function getPresignedUrl(
  fileName: string,
  contentType: string
): Promise<PresignedUpload> {
  try {
    const { data } = await api.post<PresignedUpload>('/api/uploads/presigned-url', {
      fileName,
      contentType
    });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to get upload URL.'));
  }
}

export async function uploadFileToS3(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file
  });
  if (!response.ok) {
    throw new Error('Failed to upload image to S3.');
  }
}

export async function deleteImage(key: string): Promise<void> {
  try {
    await api.delete(`/api/uploads/${encodeURIComponent(key)}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete image.'));
  }
}
