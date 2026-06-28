import { useTranslation } from 'react-i18next';
import { RotateCcw, Search } from '@/icons';
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
  const { t } = useTranslation('notifications');

  return (
    <section className="ntf-filters-toolbar" aria-label={t('instructor.filters.ariaLabel')}>
      <Input
        label={t('instructor.filters.search')}
        placeholder={t('instructor.filters.searchPlaceholder')}
        value={filters.search}
        onChange={(e) => onChange({ search: e.target.value })}
        icon={<Search size={16} aria-hidden="true" />}
      />
      <Select
        label={t('instructor.filters.readStatus')}
        value={filters.readFilter}
        onChange={(e) => onChange({ readFilter: e.target.value })}
        options={[
          { label: t('instructor.filters.all'), value: '' },
          { label: t('instructor.filters.unread'), value: 'unread' },
          { label: t('instructor.filters.read'), value: 'read' },
        ]}
      />
      <Select
        label={t('instructor.filters.type')}
        value={filters.typeFilter}
        onChange={(e) => onChange({ typeFilter: e.target.value })}
        options={typeOptions}
      />
      <Select
        label={t('instructor.filters.date')}
        value={filters.dateFilter}
        onChange={(e) => onChange({ dateFilter: e.target.value })}
        options={[
          { label: t('instructor.filters.allPeriods'), value: '' },
          { label: t('instructor.filters.today'), value: 'today' },
          { label: t('instructor.filters.last7Days'), value: 'week' },
          { label: t('instructor.filters.last30Days'), value: 'month' },
        ]}
      />
      <div className="ntf-filters-reset">
        <Button variant="outline" size="sm" onClick={onReset} icon={<RotateCcw size={14} />}>
          {t('instructor.filters.reset')}
        </Button>
      </div>
    </section>
  );
}
