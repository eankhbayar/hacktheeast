export interface User {
  userId: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserResponse;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
