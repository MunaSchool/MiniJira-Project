import axios from 'axios';
import { clearIdToken, getIdToken } from '@/lib/tokens';

/** Empty baseURL uses Vite dev proxy (/api → localhost:3000). */
const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000
});

api.interceptors.request.use((config) => {
  const token = getIdToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = (error.response?.data as { error?: string } | undefined)?.error ?? '';
    if (
      status === 401 &&
      (message.includes('Invalid or expired token') ||
        message.includes('Missing or invalid token') ||
        message.includes('Authentication required'))
    ) {
      clearIdToken();
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/callback')) {
        window.location.replace('/login?error=session_expired');
      }
    }
    return Promise.reject(error);
  }
);
