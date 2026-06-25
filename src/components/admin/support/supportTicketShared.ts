export const statusLabels: Record<string, string> = {
  OPEN: 'مفتوحة',
  IN_PROGRESS: 'قيد المعالجة',
  CLOSED: 'مغلقة',
};

export const roleLabels: Record<string, string> = {
  STUDENT: 'طالب',
  INSTRUCTOR: 'محاضر',
  SUPER_ADMIN: 'مشرف',
};

export const statusVariant = (status: string) => {
  if (status === 'CLOSED') return 'success' as const;
  if (status === 'OPEN') return 'warning' as const;
  if (status === 'IN_PROGRESS') return 'info' as const;
  return 'default' as const;
};

export const fmtSupportDate = (value: string) => new Date(value).toLocaleDateString('ar-EG', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
