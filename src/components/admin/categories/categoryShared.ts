export const statusVariant = (status: string) => {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'INACTIVE') return 'warning' as const;
  return 'default' as const;
};

export const emptyCategoryForm = {
  nameAr: '',
  nameEn: '',
  slug: '',
  icon: '',
  image: '',
  status: 'ACTIVE',
};
