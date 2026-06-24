import type { ReactNode } from 'react';
import { RotateCcw, Search } from '@/icons';
import { Button } from './Button';
import { Input } from './Input';

interface FilterBarProps {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onReset?: () => void;
  children?: ReactNode;
  className?: string;
  searchIconSize?: number;
  resetVariant?: 'ghost' | 'secondary' | 'outline';
}

export function FilterBar({
  searchValue = '',
  searchPlaceholder = 'بحث...',
  onSearchChange,
  onReset,
  children,
  className = '',
  searchIconSize = 18,
  resetVariant = 'outline',
}: FilterBarProps) {
  return (
    <div className={`filter-bar ${className}`.trim()} role="search">
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
      {onReset ? (
        <div className="filter-bar-actions">
          <Button variant={resetVariant} size="sm" onClick={onReset} icon={<RotateCcw size={16} aria-hidden />}>
            إعادة تعيين
          </Button>
        </div>
      ) : null}
    </div>
  );
}
