import type { MaterialIcon } from '@/icons';
import { Inbox } from '@/icons';
import type { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: MaterialIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const actionNode = action ?? (actionLabel && onAction ? (
    <Button onClick={onAction}>{actionLabel}</Button>
  ) : null);

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={28} />
      </div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {actionNode}
    </div>
  );
}

export function EmptyStateButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button onClick={onClick}>{label}</Button>;
}
