export const enrollmentLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
  PENDING: 'معلق',
};

export const enrollmentVariant = (status: string) => {
  if (status === 'COMPLETED') return 'success' as const;
  if (status === 'ACTIVE') return 'default' as const;
  if (status === 'CANCELLED') return 'rejected' as const;
  return 'default' as const;
};

export const fmtEnrollmentDate = (value?: string | null) => (value
  ? new Date(value).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
  : '—');
