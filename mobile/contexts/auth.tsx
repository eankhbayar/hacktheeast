import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { login as apiLogin, register as apiRegister, refreshToken, getMe, AUTH_KEYS } from '@/services/auth';
import { configureAuth } from '@/services/api';
import type { User, LoginRequest, RegisterRequest } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getAccessToken = useCallback(async () => {
    return SecureStore.getItemAsync(AUTH_KEYS.ACCESS_TOKEN);
  }, []);

  const doRefresh = useCallback(async (): Promise<string | null> => {
    const refreshTokenValue = await SecureStore.getItemAsync(
      AUTH_KEYS.REFRESH_TOKEN
    );
    if (!refreshTokenValue) return null;
    try {
      const data = await refreshToken(refreshTokenValue);
      await SecureStore.setItemAsync(AUTH_KEYS.ACCESS_TOKEN, data.accessToken);
      setUser(data.user);
      return data.accessToken;
    } catch {
      await SecureStore.deleteItemAsync(AUTH_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(AUTH_KEYS.REFRESH_TOKEN);
      setUser(null);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(AUTH_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(AUTH_KEYS.REFRESH_TOKEN);
    setUser(null);
  }, []);

  useEffect(() => {
    configureAuth(getAccessToken, doRefresh);
  }, [getAccessToken, doRefresh]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const token = await SecureStore.getItemAsync(AUTH_KEYS.ACCESS_TOKEN);
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await getMe();
        if (!cancelled) setUser(userData);
      } catch {
        const newToken = await doRefresh();
        if (!newToken && !cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [doRefresh]);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await apiLogin(data);
    await SecureStore.setItemAsync(AUTH_KEYS.ACCESS_TOKEN, response.accessToken);
    await SecureStore.setItemAsync(AUTH_KEYS.REFRESH_TOKEN, response.refreshToken);
    setUser(response.user);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await apiRegister(data);
    await SecureStore.setItemAsync(AUTH_KEYS.ACCESS_TOKEN, response.accessToken);
    await SecureStore.setItemAsync(AUTH_KEYS.REFRESH_TOKEN, response.refreshToken);
    setUser(response.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
