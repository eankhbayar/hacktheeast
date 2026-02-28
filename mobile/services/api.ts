import axios, { type InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';

const API_URL =
  Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let getAccessToken: (() => Promise<string | null>) | null = null;
let refresh: (() => Promise<string | null>) | null = null;

export function configureAuth(
  tokenGetter: () => Promise<string | null>,
  refreshFn: () => Promise<string | null>
) {
  getAccessToken = tokenGetter;
  refresh = refreshFn;
}

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (getAccessToken) {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && refresh) {
      originalRequest._retry = true;
      const newToken = await refresh();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export const generateContent = async (
  userId: string,
  prompt: string
): Promise<string> => {
  const response = await api.post('/generate', { userId, prompt });
  return response.data.content;
};

export default api;
