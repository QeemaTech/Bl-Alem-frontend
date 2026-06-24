import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
  icon?: ReactNode;
  floating?: boolean;
}

export function Input({
  label,
  error,
  helper,
  icon,
  floating = false,
  className = '',
  id,
  placeholder,
  ...props
}: InputProps) {
  const inputId = id || `input-${label.replace(/\s+/g, '-')}`;

  if (floating) {
    return (
      <label className={cn('field relative block', error && 'has-error')}>
        <div className="input-wrap">
          {icon ? <span className="input-icon">{icon}</span> : null}
          <input
            id={inputId}
            className={cn(
              'input peer placeholder-transparent',
              error && 'input-error',
              className,
            )}
            placeholder={placeholder || label}
            {...props}
          />
          <span
            className={cn(
              'pointer-events-none absolute text-sm font-semibold text-on-surface-variant transition-all',
              'peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary',
              'peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs',
              'top-3.5',
            )}
            style={{ insetInlineStart: '1rem' }}
          >
            {label}
          </span>
        </div>
        {error ? <small className="field-error">{error}</small> : null}
        {!error && helper ? <small className="field-helper">{helper}</small> : null}
      </label>
    );
  }

  return (
    <label className="field" htmlFor={inputId}>
      <span>{label}</span>
      <div className="input-wrap">
        {icon ? <span className="input-icon">{icon}</span> : null}
        <input
          id={inputId}
          className={cn('input', error && 'input-error', className)}
          placeholder={placeholder}
          {...props}
        />
      </div>
      {error ? <small className="field-error">{error}</small> : null}
      {!error && helper ? <small className="field-helper">{helper}</small> : null}
    </label>
  );
}
