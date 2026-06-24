import type { CSSProperties } from 'react';
import { cn } from '../../lib/cn';

export interface IconProps {
  name: string;
  size?: number;
  className?: string;
  filled?: boolean;
  ariaHidden?: boolean;
  style?: CSSProperties;
}

export function Icon({
  name,
  size = 20,
  className,
  filled = false,
  ariaHidden = true,
  style,
}: IconProps) {
  return (
    <span
      className={cn(
        filled ? 'material-symbols-rounded' : 'material-symbols-outlined',
        'inline-flex shrink-0 select-none leading-none',
        className,
      )}
      style={{ fontSize: size, width: size, height: size, ...style }}
      aria-hidden={ariaHidden}
    >
      {name}
    </span>
  );
}
