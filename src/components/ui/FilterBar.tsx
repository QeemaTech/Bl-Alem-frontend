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
}

export function FilterBar({
  searchValue = '',
  searchPlaceholder = 'بحث...',
  onSearchChange,
  onReset,
  children,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      {onSearchChange ? (
        <Input
          label="بحث"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<Search size={18} />}
        />
      ) : null}
      {children}
      {onReset ? (
        <div className="filter-bar-actions">
          <Button variant="ghost" size="sm" onClick={onReset} icon={<RotateCcw size={16} />}>
            إعادة تعيين
          </Button>
        </div>
      ) : null}
    </div>
  );
}
