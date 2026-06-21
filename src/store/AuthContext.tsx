import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bi_alem_token'));
  const [isLoading, setIsLoading] = useState(Boolean(token));

  const persistSession = (nextToken: string, nextUser: User) => {
    localStorage.setItem('bi_alem_token', nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      if (!token) { setIsLoading(false); return; }
      try {
        const currentUser = await authApi.me();
        if (mounted) setUser(currentUser);
      } catch {
        localStorage.removeItem('bi_alem_token');
        if (mounted) { setToken(null); setUser(null); }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadUser();
    return () => { mounted = false; };
  }, [token]);

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
    try { if (token) await authApi.logout(); }
    finally { localStorage.removeItem('bi_alem_token'); setToken(null); setUser(null); }
  }, [token]);

  const value = useMemo(() => ({ user, token, isAuthenticated: Boolean(user && token), isLoading, login, register, verifyOtp, socialLogin, logout }), [user, token, isLoading, login, register, verifyOtp, socialLogin, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
