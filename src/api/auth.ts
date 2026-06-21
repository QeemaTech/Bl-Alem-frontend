import { apiClient } from './client';
import type { ApiResponse, AuthPayload, LoginInput, OtpSendInput, OtpVerifyInput, RegisterInput, SocialLoginInput, User } from '../utils/types';

export const authApi = {
  register: async (payload: RegisterInput) => {
    const { data } = await apiClient.post<ApiResponse<AuthPayload>>('/auth/register', payload);
    return data.data;
  },
  login: async (payload: LoginInput) => {
    const body = {
      password: payload.password,
      identifier: payload.identifier || payload.email,
      email: payload.email,
    };
    const { data } = await apiClient.post<ApiResponse<AuthPayload>>('/auth/login', body);
    return data.data;
  },
  sendOtp: async (payload: OtpSendInput) => {
    const { data } = await apiClient.post<ApiResponse<{ phone: string; devCode?: string }>>('/auth/otp/send', payload);
    return data.data;
  },
  verifyOtp: async (payload: OtpVerifyInput) => {
    const { data } = await apiClient.post<ApiResponse<AuthPayload & { verified: boolean }>>('/auth/otp/verify', payload);
    return data.data;
  },
  socialLogin: async (payload: SocialLoginInput) => {
    const { data } = await apiClient.post<ApiResponse<AuthPayload & { provider: string }>>('/auth/social', payload);
    return data.data;
  },
  me: async () => {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/me');
    return data.data;
  },
  logout: async () => apiClient.post('/auth/logout'),
};
