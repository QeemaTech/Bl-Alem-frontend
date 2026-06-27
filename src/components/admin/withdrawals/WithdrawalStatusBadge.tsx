import { useAdminWithdrawalLabels } from '../../../hooks/useAdminWithdrawalLabels';
import { Badge } from '../../ui/Badge';
import { withdrawalStatusVariant, type WithdrawalStatus } from './types';

interface WithdrawalStatusBadgeProps {
  status: WithdrawalStatus | string;
}

export function WithdrawalStatusBadge({ status }: WithdrawalStatusBadgeProps) {
  const { getStatusLabel } = useAdminWithdrawalLabels();
  const key = String(status) as WithdrawalStatus;

  return (
    <Badge variant={withdrawalStatusVariant[key] || 'default'} dot className="status-badge">
      {getStatusLabel(key)}
    </Badge>
  );
}
