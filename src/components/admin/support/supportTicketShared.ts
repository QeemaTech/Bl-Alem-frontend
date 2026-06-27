export const statusVariant = (status: string) => {
  if (status === 'CLOSED') return 'success' as const;
  if (status === 'OPEN') return 'warning' as const;
  if (status === 'IN_PROGRESS') return 'info' as const;
  return 'default' as const;
};
