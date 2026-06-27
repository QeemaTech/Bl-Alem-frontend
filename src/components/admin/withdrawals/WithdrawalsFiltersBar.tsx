import { useTranslation } from 'react-i18next';
import { RotateCcw } from '@/icons';
import { useAdminWithdrawalLabels } from '../../../hooks/useAdminWithdrawalLabels';
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
  const { t } = useTranslation('withdrawals');
  const { statusLabels } = useAdminWithdrawalLabels();
  const hasActiveFilters = Boolean(filters.status || filters.dateFrom || filters.dateTo);

  return (
    <section className="filter-bar withdrawals-filter-bar" aria-label={t('admin.filters.ariaLabel')}>
      <Select
        label={t('admin.filters.status')}
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value })}
        options={[
          { label: t('admin.filters.allStatuses'), value: '' },
          { label: statusLabels.PENDING, value: 'PENDING' },
          { label: statusLabels.APPROVED, value: 'APPROVED' },
          { label: statusLabels.PAID, value: 'PAID' },
          { label: statusLabels.REJECTED, value: 'REJECTED' },
        ]}
      />
      <Input
        label={t('admin.filters.dateFrom')}
        type="date"
        value={filters.dateFrom}
        onChange={(e) => onChange({ dateFrom: e.target.value })}
      />
      <Input
        label={t('admin.filters.dateTo')}
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
          {t('admin.filters.reset')}
        </Button>
      </div>
    </section>
  );
}
