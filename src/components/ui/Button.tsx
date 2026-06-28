import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  icon,
  iconPosition = 'start',
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const iconNode = loading ? <span className="btn-spinner" aria-hidden="true" /> : icon;
  return (
    <button
      type={type}
      className={cn(
        'btn',
        `btn-${variant}`,
        sizeClass,
        fullWidth && 'btn-full',
        loading && 'btn-loading',
        iconPosition === 'end' && 'btn-icon-end',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {iconPosition === 'end' ? (
        <>
          {children}
          {iconNode}
        </>
      ) : (
        <>
          {iconNode}
          {children}
        </>
      )}
    </button>
  );
}
