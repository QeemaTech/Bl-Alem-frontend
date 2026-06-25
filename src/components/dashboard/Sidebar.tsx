import type { MaterialIcon } from '@/icons';
import { ChevronLeft, ChevronRight, LogOut } from '@/icons';
import { cn } from '@/lib/cn';
import { Button } from '../ui/Button';
import { BrandMark } from '../ui/BrandMark';
import { useAuth } from '../../store/AuthContext';
import { SidebarItem } from './SidebarItem';

interface SidebarProps {
  title: string;
  items: { label: string; path: string; icon: MaterialIcon }[];
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onLogout: () => void;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  title,
  items,
  isOpen,
  isCollapsed,
  onClose,
  onLogout,
  onToggleCollapse,
}: SidebarProps) {
  const { user } = useAuth();
  const initials = user?.fullName?.split(' ').map((w) => w[0]).slice(0, 2).join('') || '؟';

  return (
    <aside
      className={cn('sidebar', isOpen && 'open', isCollapsed && 'is-collapsed')}
      aria-label="القائمة الجانبية"
    >
      <div className="sidebar-brand">
        <BrandMark variant="sidebar" />
        {onToggleCollapse ? (
          <button
            type="button"
            className="sidebar-collapse-trigger"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'فتح القائمة الجانبية' : 'طيّ القائمة الجانبية'}
          >
            {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        ) : null}
      </div>

      {!isCollapsed ? (
        <p className="sidebar-section-label">{title}</p>
      ) : null}

      <nav className="sidebar-nav" aria-label={title}>
        {items.map(({ label, path, icon }) => (
          <SidebarItem
            key={`${label}-${path}`}
            label={label}
            path={path}
            icon={icon}
            onNavigate={onClose}
          />
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          {!isCollapsed ? (
            <div className="sidebar-user-info">
              <strong>{user?.fullName}</strong>
              <small>
                {user?.role === 'STUDENT' ? 'طالب' : user?.role === 'INSTRUCTOR' ? 'محاضر' : 'مشرف'}
              </small>
            </div>
          ) : null}
        </div>
        {!isCollapsed ? (
          <Button variant="ghost" fullWidth size="sm" onClick={onLogout} icon={<LogOut size={18} />}>
            تسجيل الخروج
          </Button>
        ) : (
          <button
            type="button"
            className="sidebar-logout-icon"
            onClick={onLogout}
            aria-label="تسجيل الخروج"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </aside>
  );
}
