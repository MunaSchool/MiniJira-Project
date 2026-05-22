import axios from 'axios';
import { loadSession } from '@/lib/auth-utils';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const session = loadSession();
  if (session?.token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});
