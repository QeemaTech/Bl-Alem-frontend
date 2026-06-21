import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlighted' | 'stat' | 'clickable';
}

export function Card({ className = '', variant = 'default', ...props }: CardProps) {
  const variantClass =
    variant === 'highlighted' ? 'card-highlighted' :
    variant === 'stat' ? 'card-stat' :
    variant === 'clickable' ? 'card-clickable' : '';
  return <div className={`card ${variantClass} ${className}`} {...props} />;
}
