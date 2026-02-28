import axios from 'axios';
import Constants from 'expo-constants';
import api from './api';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types/auth';

const API_URL =
  Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

const AUTH_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
};

export async function login(
  data: LoginRequest
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
}

export async function register(
  data: RegisterRequest
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
}

export async function refreshToken(refreshTokenValue: string): Promise<{
  accessToken: string;
  expiresIn: number;
  user: User;
}> {
  // Use a plain axios call to bypass the api interceptor.
  // Otherwise a 401 here triggers the interceptor's refresh logic again,
  // creating an infinite loop.
  const response = await axios.post<{
    accessToken: string;
    expiresIn: number;
    user: User;
  }>(`${API_URL}/auth/refresh`, { refreshToken: refreshTokenValue });
  return response.data;
}

export async function getMe(): Promise<User> {
  const response = await api.get<User>('/auth/me');
  return response.data;
}

export { AUTH_KEYS };
