import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant =
  | 'default' | 'active' | 'pending' | 'published' | 'rejected'
  | 'suspended' | 'completed' | 'live' | 'warning' | 'success' | 'danger' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({ className = '', variant = 'default', dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, className)} {...props}>
      {dot ? (
        <span className="ms-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />
      ) : null}
      {children}
    </span>
  );
}
