import axios from 'axios';
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

export const generateContent = async (
  userId: string,
  prompt: string
): Promise<string> => {
  const response = await api.post('/generate', { userId, prompt });
  return response.data.content;
};

export default api;