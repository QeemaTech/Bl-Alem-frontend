export const fmtMoney = (value: number) => `${Number(value || 0).toLocaleString('ar-SA')} ر.س`;

export const fmtDate = (value?: string | null) => (value
  ? new Date(value).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
  : '—');

export const formatInterests = (interests: unknown) => {
  if (!interests) return '—';
  if (Array.isArray(interests)) return interests.join('، ');
  return String(interests);
};

export const roleLabels: Record<string, string> = {
  STUDENT: 'طالب',
  INSTRUCTOR: 'محاضر',
  SUPER_ADMIN: 'مشرف',
};

export const accountStatusLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  PENDING: 'بانتظار التفعيل',
  SUSPENDED: 'موقوف',
  REJECTED: 'مرفوض',
};

export const approvalLabels: Record<string, string> = {
  PENDING: 'قيد المراجعة',
  APPROVED: 'معتمد',
  REJECTED: 'مرفوض',
  SUSPENDED: 'موقوف',
};

export const enrollmentLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
};

export const accountStatusVariant = (status: string) => {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'SUSPENDED') return 'suspended' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  return 'default' as const;
};

export const roleVariant = (role: string) => {
  if (role === 'SUPER_ADMIN') return 'warning' as const;
  if (role === 'INSTRUCTOR') return 'info' as const;
  return 'default' as const;
};

export const approvalVariant = (status: string) => {
  if (status === 'APPROVED') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  if (status === 'SUSPENDED') return 'suspended' as const;
  return 'default' as const;
};
