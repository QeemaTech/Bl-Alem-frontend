import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from '@/icons';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string }[];
  error?: string;
  helper?: string;
}

export function Select({ label, options, error, helper, className = '', ...props }: SelectProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="select-wrap">
        <select
          className={`input select ${error ? 'input-error' : ''} ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="select-chevron" aria-hidden />
      </div>
      {error ? <small className="field-error">{error}</small> : null}
      {!error && helper ? <small className="field-helper">{helper}</small> : null}
    </label>
  );
}
