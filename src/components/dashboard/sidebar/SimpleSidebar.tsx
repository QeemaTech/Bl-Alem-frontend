import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import type { MaterialIcon } from '@/icons';
import { cn } from '@/lib/cn';
import { useAuth } from '../../../store/AuthContext';
import { SidebarFooter } from './SidebarFooter';
import { SidebarHeader } from './SidebarHeader';
import { SidebarItem } from './SidebarItem';

function pathMatches(itemPath: string, pathname: string) {
  if (pathname === itemPath) return true;
  const prefix = itemPath.endsWith('/') ? itemPath : `${itemPath}/`;
  return pathname.startsWith(prefix);
}

interface SimpleSidebarProps {
  titleKey: string;
  items: { labelKey: string; path: string; icon: MaterialIcon }[];
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onLogout: () => void;
  onToggleCollapse?: () => void;
}

export function SimpleSidebar({
  titleKey,
  items,
  isOpen,
  isCollapsed,
  onClose,
  onLogout,
  onToggleCollapse,
}: SimpleSidebarProps) {
  const { t } = useTranslation('nav');
  const { t: tu } = useTranslation('users');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const { pathname } = useLocation();
  const collapsed = isCollapsed && !isOpen;
  const title = t(titleKey);
  const initials = user?.fullName?.split(' ').map((w) => w[0]).slice(0, 2).join('') || tc('sidebar.unknownInitial');

  const activePath = useMemo(() => {
    const matches = items
      .map((item) => item.path)
      .filter((path) => pathMatches(path, pathname));
    if (!matches.length) return null;
    return matches.reduce((best, path) => (path.length > best.length ? path : best));
  }, [items, pathname]);

  const roleLabel =
    user?.role === 'STUDENT' ? tu('roles.student')
      : user?.role === 'INSTRUCTOR' ? tu('roles.instructor')
        : tu('roles.admin');

  return (
    <aside
      className={cn('sidebar', isOpen && 'open', collapsed && 'is-collapsed')}
      aria-label={tc('sidebar.ariaLabel')}
    >
      <SidebarHeader isCollapsed={collapsed} onToggleCollapse={onToggleCollapse} />

      {!collapsed ? (
        <p className="sidebar-section-label">{title}</p>
      ) : null}

      <nav className="sidebar-nav" aria-label={title}>
        {items.map(({ labelKey, path, icon }) => (
          <SidebarItem
            key={`${labelKey}-${path}`}
            labelKey={labelKey}
            path={path}
            icon={icon}
            active={path === activePath}
            collapsed={collapsed}
            onNavigate={onClose}
          />
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          {!collapsed ? (
            <div className="sidebar-user-info">
              <strong>{user?.fullName}</strong>
              <small>{roleLabel}</small>
            </div>
          ) : null}
        </div>
        <SidebarFooter collapsed={collapsed} onLogout={onLogout} />
      </div>
    </aside>
  );
}
