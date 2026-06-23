import { RotateCcw, Search } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

export interface NotificationFiltersState {
  search: string;
  readFilter: string;
  typeFilter: string;
  dateFilter: string;
}

interface NotificationFiltersProps {
  filters: NotificationFiltersState;
  typeOptions: { label: string; value: string }[];
  onChange: (patch: Partial<NotificationFiltersState>) => void;
  onReset: () => void;
}

export function NotificationFilters({
  filters,
  typeOptions,
  onChange,
  onReset,
}: NotificationFiltersProps) {
  return (
    <section className="ntf-filters-toolbar" aria-label="فلاتر الإشعارات">
      <Input
        label="بحث"
        placeholder="بحث في العنوان أو النص..."
        value={filters.search}
        onChange={(e) => onChange({ search: e.target.value })}
        icon={<Search size={16} aria-hidden="true" />}
      />
      <Select
        label="الحالة"
        value={filters.readFilter}
        onChange={(e) => onChange({ readFilter: e.target.value })}
        options={[
          { label: 'الكل', value: '' },
          { label: 'غير مقروء', value: 'unread' },
          { label: 'مقروء', value: 'read' },
        ]}
      />
      <Select
        label="النوع"
        value={filters.typeFilter}
        onChange={(e) => onChange({ typeFilter: e.target.value })}
        options={typeOptions}
      />
      <Select
        label="التاريخ"
        value={filters.dateFilter}
        onChange={(e) => onChange({ dateFilter: e.target.value })}
        options={[
          { label: 'كل الفترات', value: '' },
          { label: 'اليوم', value: 'today' },
          { label: 'آخر 7 أيام', value: 'week' },
          { label: 'آخر 30 يوماً', value: 'month' },
        ]}
      />
      <div className="ntf-filters-reset">
        <Button variant="outline" size="sm" onClick={onReset} icon={<RotateCcw size={14} />}>
          إعادة تعيين
        </Button>
      </div>
    </section>
  );
}
