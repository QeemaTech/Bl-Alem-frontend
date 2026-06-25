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
  return (
    <section className="stats-grid admin-withdrawals-stats" aria-label="ملخص السحوبات">
      <StatCard title="إجمالي الطلبات" value={String(stats.total)} icon={Wallet} />
      <StatCard title="قيد المراجعة" value={String(stats.pendingCount)} icon={Clock} />
      <StatCard
        title="معتمدة"
        value={String(stats.approvedCount)}
        hint="بانتظار التحويل"
        icon={CheckCircle2}
      />
      <StatCard title="مدفوعة" value={String(stats.paidCount)} icon={CheckCircle2} trendUp />
      <StatCard title="مرفوضة" value={String(stats.rejectedCount)} icon={XCircle} />
    </section>
  );
}
