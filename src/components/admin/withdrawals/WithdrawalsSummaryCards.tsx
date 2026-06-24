import { CheckCircle2, Clock, Wallet, XCircle } from '@/icons';
import type { LucideIcon } from '@/icons';

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

function SummaryCard({
  title,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone: 'default' | 'pending' | 'approved' | 'paid' | 'rejected';
}) {
  return (
    <article className={`wd-summary-card is-${tone}`}>
      <span className="wd-summary-icon" aria-hidden="true">
        <Icon size={22} />
      </span>
      <div className="wd-summary-body">
        <p className="wd-summary-title">{title}</p>
        <strong className="wd-summary-value">{value}</strong>
        {hint ? <small className="wd-summary-hint">{hint}</small> : null}
      </div>
    </article>
  );
}

export function WithdrawalsSummaryCards({ stats }: WithdrawalsSummaryCardsProps) {
  return (
    <section className="wd-summary-grid" aria-label="ملخص السحوبات">
      <SummaryCard
        title="إجمالي الطلبات"
        value={String(stats.total)}
        icon={Wallet}
        tone="default"
      />
      <SummaryCard
        title="قيد المراجعة"
        value={String(stats.pendingCount)}
        icon={Clock}
        tone="pending"
      />
      <SummaryCard
        title="معتمدة"
        value={String(stats.approvedCount)}
        hint="بانتظار التحويل"
        icon={CheckCircle2}
        tone="approved"
      />
      <SummaryCard
        title="مدفوعة"
        value={String(stats.paidCount)}
        icon={CheckCircle2}
        tone="paid"
      />
      <SummaryCard
        title="مرفوضة"
        value={String(stats.rejectedCount)}
        icon={XCircle}
        tone="rejected"
      />
    </section>
  );
}
