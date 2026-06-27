export const paymentStatusVariant = (status: string) => {
  if (status === 'PAID') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'FAILED') return 'rejected' as const;
  if (status === 'REFUNDED') return 'warning' as const;
  return 'default' as const;
};
