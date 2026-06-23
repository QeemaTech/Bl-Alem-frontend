interface NotificationBadgeProps {
  variant: 'unread' | 'read' | 'important' | 'success' | 'type';
  label: string;
}

export function NotificationBadge({ variant, label }: NotificationBadgeProps) {
  return (
    <span className={`ntf-badge is-${variant}`}>
      {label}
    </span>
  );
}
