import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
  icon?: ReactNode;
}

export function Input({ label, error, helper, icon, className = '', ...props }: InputProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        {icon ? <span className="input-icon">{icon}</span> : null}
        <input
          className={`input ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
      </div>
      {error ? <small className="field-error">{error}</small> : null}
      {!error && helper ? <small className="field-helper">{helper}</small> : null}
    </label>
  );
}
