import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant =
  | 'default' | 'active' | 'pending' | 'published' | 'rejected'
  | 'suspended' | 'completed' | 'live' | 'warning' | 'success' | 'danger' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  children: ReactNode;
}

export function Badge({ className = '', variant = 'default', dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, className)} {...props}>
      {dot ? <span className="badge-dot" aria-hidden /> : null}
      <span className="badge-label">{children}</span>
    </span>
  );
}
