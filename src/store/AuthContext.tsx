import axios from 'axios';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import {
  clearAuthSession,
  persistAuthSession,
  readStoredToken,
  readStoredUser,
  SESSION_EXPIRED_EVENT,
} from '../utils/authStorage';
import type { LoginInput, OtpVerifyInput, RegisterInput, SocialLoginInput, User } from '../utils/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginInput) => Promise<User>;
  register: (payload: RegisterInput) => Promise<User>;
  verifyOtp: (payload: OtpVerifyInput) => Promise<User>;
  socialLogin: (payload: SocialLoginInput) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const getErrorStatus = (error: unknown): number | undefined => {
  if (axios.isAxiosError(error)) return error.response?.status;
  return undefined;
};

const shouldClearSession = (error: unknown) => {
  const status = getErrorStatus(error);
  return status === 401 || status === 403;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [isLoading, setIsLoading] = useState(() => Boolean(readStoredToken()));

  const persistSession = (nextToken: string, nextUser: User) => {
    persistAuthSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
  };

  const clearSession = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const onSessionExpired = () => clearSession();
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [clearSession]);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      if (!token) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authApi.me();
        if (!mounted) return;
        persistAuthSession(token, currentUser);
        setUser(currentUser);
      } catch (error) {
        if (!mounted) return;
        if (shouldClearSession(error)) {
          clearSession();
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadUser();
    return () => { mounted = false; };
  }, [token, clearSession]);

  const login = useCallback(async (payload: LoginInput) => {
    const data = await authApi.login(payload);
    persistSession(data.token, data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterInput) => {
    const data = await authApi.register(payload);
    persistSession(data.token, data.user);
    return data.user;
  }, []);

  const verifyOtp = useCallback(async (payload: OtpVerifyInput) => {
    const data = await authApi.verifyOtp(payload);
    persistSession(data.token, data.user);
    return data.user;
  }, []);

  const socialLogin = useCallback(async (payload: SocialLoginInput) => {
    const data = await authApi.socialLogin(payload);
    persistSession(data.token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) await authApi.logout();
    } finally {
      clearSession();
    }
  }, [token, clearSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      register,
      verifyOtp,
      socialLogin,
      logout,
    }),
    [user, token, isLoading, login, register, verifyOtp, socialLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
