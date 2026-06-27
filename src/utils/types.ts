export type Role = 'STUDENT' | 'INSTRUCTOR' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'REJECTED';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  role: Role;
  status: UserStatus;
  preferredLanguage: string;
  referralCode?: string | null;
  instructorProfile?: { approvalStatus: string } | null;
  studentProfile?: unknown;
}

export interface AuthPayload { user: User; token: string }
export interface ApiResponse<T> { success: boolean; message: string; data: T }
export interface LoginInput { email?: string; identifier?: string; password: string }
export interface RegisterInput { fullName: string; email: string; phone?: string; password: string; role: 'STUDENT' | 'INSTRUCTOR'; referralCode?: string }
export interface OtpSendInput { phone: string }
export interface OtpVerifyInput { phone: string; code: string }
export interface SocialLoginInput { provider: 'google' | 'facebook' | 'apple' | 'twitter'; email: string; fullName?: string }
