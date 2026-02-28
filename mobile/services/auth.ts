import api from './api';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types/auth';

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
  const response = await api.post<{
    accessToken: string;
    expiresIn: number;
    user: User;
  }>('/auth/refresh', { refreshToken: refreshTokenValue });
  return response.data;
}

export async function getMe(): Promise<User> {
  const response = await api.get<User>('/auth/me');
  return response.data;
}

export { AUTH_KEYS };
