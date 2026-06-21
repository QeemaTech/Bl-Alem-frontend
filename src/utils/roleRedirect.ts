import type { Role } from './types';

export const getDashboardPath = (role?: Role) => {
  if (role === 'SUPER_ADMIN') return '/admin/dashboard';
  if (role === 'INSTRUCTOR') return '/instructor/dashboard';
  if (role === 'STUDENT') return '/student/dashboard';
  return '/login';
};
