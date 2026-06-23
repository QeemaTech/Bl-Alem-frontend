import { WITHDRAWAL_STATUS_LABELS, type WithdrawalStatus } from './types';

interface WithdrawalStatusBadgeProps {
  status: WithdrawalStatus | string;
}

export function WithdrawalStatusBadge({ status }: WithdrawalStatusBadgeProps) {
  const key = String(status) as WithdrawalStatus;
  const label = WITHDRAWAL_STATUS_LABELS[key] || String(status);
  return (
    <span className={`wd-status-pill is-${key.toLowerCase()}`}>
      {label}
    </span>
  );
}
