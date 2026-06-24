import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlighted' | 'stat' | 'clickable';
  elevation?: 1 | 2 | 3;
}

export function Card({
  className = '',
  variant = 'default',
  elevation,
  ...props
}: CardProps) {
  const variantClass =
    variant === 'highlighted' ? 'card-highlighted' :
    variant === 'stat' ? 'card-stat' :
    variant === 'clickable' ? 'card-clickable' : '';

  return (
    <div
      className={cn(
        'card',
        variantClass,
        elevation === 2 && 'shadow-2',
        elevation === 3 && 'shadow-3',
        className,
      )}
      {...props}
    />
  );
}
