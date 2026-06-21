import type { HTMLAttributes } from 'react';

type BadgeVariant =
  | 'default' | 'active' | 'pending' | 'published' | 'rejected'
  | 'suspended' | 'completed' | 'live' | 'warning' | 'success' | 'danger' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  return <span className={`badge badge-${variant} ${className}`} {...props} />;
}
