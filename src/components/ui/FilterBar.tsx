import type { ReactNode } from 'react';
import { Search, RotateCcw } from 'lucide-react';
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
  resetVariant = 'ghost',
}: FilterBarProps) {
  return (
    <div className={`filter-bar ${className}`.trim()} role="search">
      {onSearchChange ? (
        <Input
          label="بحث"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<Search size={searchIconSize} aria-hidden="true" />}
        />
      ) : null}
      {children}
      {onReset ? (
        <div className="filter-bar-actions">
          <Button variant={resetVariant} size="sm" onClick={onReset} icon={<RotateCcw size={16} aria-hidden="true" />}>
            إعادة تعيين
          </Button>
        </div>
      ) : null}
    </div>
  );
}
