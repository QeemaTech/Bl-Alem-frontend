import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string }[];
  error?: string;
  helper?: string;
}

export function Select({ label, options, error, helper, className = '', id, ...props }: SelectProps) {
  const selectId = id || `select-${label.replace(/\s+/g, '-')}`;

  return (
    <label className="field" htmlFor={selectId}>
      <span>{label}</span>
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'select w-full cursor-pointer appearance-none rounded-xl border bg-surface-container text-on-surface outline-none transition-all duration-200',
            'min-h-12 px-4 focus:border-primary focus:ring-4 focus:ring-primary/15',
            error ? 'border-error' : 'border-outline hover:border-outline-variant',
            className,
          )}
          style={{ paddingInlineEnd: '2.5rem' }}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute top-1/2 grid -translate-y-1/2 place-items-center text-on-surface-variant"
          style={{ insetInlineEnd: '0.875rem' }}
          aria-hidden
        >
          <Icon name="expand_more" size={22} />
        </span>
      </div>
      {error ? <small className="field-error">{error}</small> : null}
      {!error && helper ? <small className="field-helper">{helper}</small> : null}
    </label>
  );
}
