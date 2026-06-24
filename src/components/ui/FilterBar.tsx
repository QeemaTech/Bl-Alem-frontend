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
  resetVariant = 'ghost',
}: FilterBarProps) {
  return (
<<<<<<< Updated upstream
    <div className={`filter-bar ${className}`.trim()} role="search">
=======
    <div className="filter-bar" role="search">
>>>>>>> Stashed changes
      {onSearchChange ? (
        <Input
          label="بحث"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
<<<<<<< Updated upstream
          icon={<Search size={searchIconSize} aria-hidden="true" />}
=======
          placeholder={searchPlaceholder}
          icon={<Search size={18} />}
>>>>>>> Stashed changes
        />
      ) : null}
      {children}
      {onReset ? (
        <div className="filter-bar-actions">
<<<<<<< Updated upstream
          <Button variant={resetVariant} size="sm" onClick={onReset} icon={<RotateCcw size={16} aria-hidden="true" />}>
=======
          <Button variant="outline" size="sm" icon={<RotateCcw size={16} />} onClick={onReset}>
>>>>>>> Stashed changes
            إعادة تعيين
          </Button>
        </div>
      ) : null}
    </div>
  );
}
