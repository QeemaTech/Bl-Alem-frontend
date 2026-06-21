interface ProgressBarProps {
  value: number;
  label?: string;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, label, size = 'sm' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div>
      {label ? (
        <div className="progress-label">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      ) : null}
      <div className={`progress ${size === 'md' ? 'progress-md' : ''}`} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
