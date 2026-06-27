import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, Wallet, XCircle } from '@/icons';
import { StatCard } from '../../ui/StatCard';

interface SummaryStat {
  total: number;
  pendingCount: number;
  approvedCount: number;
  paidCount: number;
  rejectedCount: number;
}

interface WithdrawalsSummaryCardsProps {
  stats: SummaryStat;
}

export function WithdrawalsSummaryCards({ stats }: WithdrawalsSummaryCardsProps) {
  const { t } = useTranslation('withdrawals');

  return (
    <section className="stats-grid admin-withdrawals-stats" aria-label={t('admin.stats.ariaLabel')}>
      <StatCard title={t('admin.stats.total')} value={String(stats.total)} icon={Wallet} />
      <StatCard title={t('admin.stats.pending')} value={String(stats.pendingCount)} icon={Clock} />
      <StatCard
        title={t('admin.stats.approved')}
        value={String(stats.approvedCount)}
        hint={t('admin.stats.approvedHint')}
        icon={CheckCircle2}
      />
      <StatCard title={t('admin.stats.paid')} value={String(stats.paidCount)} icon={CheckCircle2} trendUp />
      <StatCard title={t('admin.stats.rejected')} value={String(stats.rejectedCount)} icon={XCircle} />
    </section>
  );
}
