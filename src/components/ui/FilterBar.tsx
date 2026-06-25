import type { ReactNode } from 'react';
import { RotateCcw, Search } from '@/icons';
import { Button } from './Button';
import { Input } from './Input';

interface FilterBarProps {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onReset?: () => void;
  resetDisabled?: boolean;
  resetLabel?: string;
  ariaLabel?: string;
  children?: ReactNode;
  className?: string;
  searchIconSize?: number;
}

export function FilterBar({
  searchValue = '',
  searchPlaceholder = 'بحث...',
  onSearchChange,
  onReset,
  resetDisabled = false,
  resetLabel = 'إعادة تعيين',
  ariaLabel = 'فلاتر البحث',
  children,
  className = '',
  searchIconSize = 18,
}: FilterBarProps) {
  return (
    <section className={`filter-bar ${className}`.trim()} aria-label={ariaLabel}>
      <div className="filter-bar-fields">
        {onSearchChange ? (
          <Input
            label="بحث"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            icon={<Search size={searchIconSize} aria-hidden />}
            className="filter-bar-search"
          />
        ) : null}
        {children}
      </div>
      {onReset ? (
        <div className="filter-bar-actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="filter-bar-reset"
            onClick={onReset}
            disabled={resetDisabled}
            icon={<RotateCcw size={16} aria-hidden />}
          >
            {resetLabel}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
