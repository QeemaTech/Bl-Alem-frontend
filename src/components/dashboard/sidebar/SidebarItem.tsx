import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { MaterialIcon } from '@/icons';
import { cn } from '@/lib/cn';

interface SidebarItemProps {
  labelKey: string;
  path: string;
  icon: MaterialIcon;
  active: boolean;
  collapsed?: boolean;
  badge?: number;
  onNavigate?: () => void;
  /** When set, used instead of translating labelKey (for admin flat nav) */
  label?: string;
}

export function SidebarItem({
  labelKey,
  path,
  icon: Icon,
  active,
  collapsed = false,
  badge,
  onNavigate,
  label: labelOverride,
}: SidebarItemProps) {
  const { t } = useTranslation('nav');
  const { t: tc } = useTranslation('common');
  const label = labelOverride ?? t(labelKey);
  const rippleRef = useRef<HTMLSpanElement>(null);

  const handleRipple = useCallback((event: React.PointerEvent<HTMLAnchorElement>) => {
    const target = rippleRef.current;
    if (!target) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    target.style.width = `${size}px`;
    target.style.height = `${size}px`;
    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
    target.classList.remove('is-animating');
    void target.offsetWidth;
    target.classList.add('is-animating');
  }, []);

  const showBadge = typeof badge === 'number' && badge > 0;

  return (
    <Link
      to={path}
      onClick={onNavigate}
      onPointerDown={handleRipple}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? label : undefined}
      data-tooltip={collapsed ? label : undefined}
      className={cn('sidebar-item', active && 'is-active')}
    >
      <span className="sidebar-item-ripple" ref={rippleRef} aria-hidden="true" />
      <span className="sidebar-item-icon" aria-hidden="true">
        <Icon size={21} fill={active ? 'currentColor' : undefined} />
      </span>
      <span className="sidebar-item-label">{label}</span>
      {showBadge ? (
        <span className="sidebar-item-badge" aria-label={tc('sidebar.badgeNew', { count: badge })}>
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </Link>
  );
}
