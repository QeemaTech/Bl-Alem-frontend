export const statusLabels: Record<string, string> = {
  ACTIVE: 'فعّال',
  INACTIVE: 'غير فعّال',
};

export const courseStatusLabels: Record<string, string> = {
  DRAFT: 'مسودة',
  PENDING_REVIEW: 'قيد المراجعة',
  APPROVED: 'معتمد',
  PUBLISHED: 'منشور',
  REJECTED: 'مرفوض',
  SUSPENDED: 'موقوف',
};

export const statusVariant = (status: string) => {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'INACTIVE') return 'warning' as const;
  return 'default' as const;
};

export const courseStatusVariant = (status: string) => {
  if (status === 'PUBLISHED') return 'published' as const;
  if (status === 'PENDING_REVIEW') return 'pending' as const;
  if (status === 'APPROVED') return 'success' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  if (status === 'SUSPENDED') return 'suspended' as const;
  if (status === 'DRAFT') return 'info' as const;
  return 'default' as const;
};

export const fmtCategoryDate = (value?: string | null) => (value
  ? new Date(value).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
  : '—');

export const emptyCategoryForm = {
  nameAr: '',
  nameEn: '',
  slug: '',
  icon: '',
  image: '',
  status: 'ACTIVE',
};
