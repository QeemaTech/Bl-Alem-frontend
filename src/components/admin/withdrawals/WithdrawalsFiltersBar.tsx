import { RotateCcw } from '@/icons';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

export interface WithdrawalsFilters {
  status: string;
  dateFrom: string;
  dateTo: string;
}

interface WithdrawalsFiltersBarProps {
  filters: WithdrawalsFilters;
  onChange: (patch: Partial<WithdrawalsFilters>) => void;
  onReset: () => void;
}

export function WithdrawalsFiltersBar({
  filters,
  onChange,
  onReset,
}: WithdrawalsFiltersBarProps) {
  const hasActiveFilters = Boolean(filters.status || filters.dateFrom || filters.dateTo);

  return (
    <section className="filter-bar withdrawals-filter-bar" aria-label="فلاتر السحوبات">
      <Select
        label="الحالة"
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value })}
        options={[
          { label: 'كل الحالات', value: '' },
          { label: 'قيد المراجعة', value: 'PENDING' },
          { label: 'معتمد', value: 'APPROVED' },
          { label: 'مدفوع', value: 'PAID' },
          { label: 'مرفوض', value: 'REJECTED' },
        ]}
      />
      <Input
        label="من تاريخ"
        type="date"
        value={filters.dateFrom}
        onChange={(e) => onChange({ dateFrom: e.target.value })}
      />
      <Input
        label="إلى تاريخ"
        type="date"
        value={filters.dateTo}
        onChange={(e) => onChange({ dateTo: e.target.value })}
      />
      <div className="withdrawals-filter-actions">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="withdrawals-filter-reset"
          onClick={onReset}
          disabled={!hasActiveFilters}
          icon={<RotateCcw size={16} />}
        >
          مسح الفلاتر
        </Button>
      </div>
    </section>
  );
}
