import { Download, RotateCcw } from 'lucide-react';
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
  onExport: () => void;
  exportDisabled?: boolean;
}

export function WithdrawalsFiltersBar({
  filters,
  onChange,
  onReset,
  onExport,
  exportDisabled,
}: WithdrawalsFiltersBarProps) {
  return (
    <section className="wd-filters-card" aria-label="فلاتر السحوبات">
      <div className="wd-filters-grid">
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
      </div>
      <div className="wd-filters-actions">
        <Button variant="outline" size="sm" onClick={onReset} icon={<RotateCcw size={16} />}>
          مسح الفلاتر
        </Button>
        <Button variant="outline" size="sm" onClick={onExport} disabled={exportDisabled} icon={<Download size={16} />}>
          تصدير Excel
        </Button>
      </div>
    </section>
  );
}
