import axios from 'axios';

export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  const { data } = await axios.get<{ status: string; timestamp: string }>(`${base}/health`, {
    timeout: 8000
  });
  return data;
}
