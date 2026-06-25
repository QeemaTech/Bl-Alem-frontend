import { WITHDRAWAL_STATUS_LABELS, type WithdrawalStatus } from './types';
import { Badge } from '../../ui/Badge';

interface WithdrawalStatusBadgeProps {
  status: WithdrawalStatus | string;
}

const statusVariant: Record<WithdrawalStatus, 'pending' | 'success' | 'rejected' | 'info'> = {
  PENDING: 'pending',
  APPROVED: 'info',
  PAID: 'success',
  REJECTED: 'rejected',
};

export function WithdrawalStatusBadge({ status }: WithdrawalStatusBadgeProps) {
  const key = String(status) as WithdrawalStatus;
  const label = WITHDRAWAL_STATUS_LABELS[key] || String(status);
  return (
    <Badge variant={statusVariant[key] || 'default'} dot className="status-badge">
      {label}
    </Badge>
  );
}
