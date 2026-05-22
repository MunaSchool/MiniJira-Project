import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null');
  if (tokens?.id_token) {
    config.headers.Authorization = `Bearer ${tokens.id_token}`;
  }
  return config;
});

export default apiClient;
