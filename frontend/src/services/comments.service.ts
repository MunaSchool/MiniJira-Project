import axios from 'axios';
import { api } from './api';

export interface Comment {
  commentId: string;
  taskId: string;
  text: string;
  createdAt: string;
  userId?: string;
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

export async function getComments(taskId: string): Promise<Comment[]> {
  try {
    const { data } = await api.get<Comment[]>('/api/comments', { params: { taskId } });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load comments.'));
  }
}

export async function createComment(taskId: string, text: string): Promise<Comment> {
  try {
    const { data } = await api.post<Comment>('/api/comments', { taskId, text });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to add comment.'));
  }
}
