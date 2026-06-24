<<<<<<< Updated upstream
import type { LucideIcon } from 'lucide-react';
import { LogOut } from 'lucide-react';
=======
import { NavLink } from 'react-router-dom';
import type { MaterialIcon } from '@/icons';
import { LogOut, MenuOpen } from '@/icons';
>>>>>>> Stashed changes
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
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export function Sidebar({
  title,
  items,
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
  onLogout,
}: SidebarProps) {
  const { user } = useAuth();
  const initials = user?.fullName?.split(' ').map((w) => w[0]).slice(0, 2).join('') || '؟';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="القائمة الجانبية">
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <BrandMark variant="sidebar" />
        <button
          type="button"
          className="icon-btn hidden lg:inline-flex"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
        >
          <MenuOpen size={20} />
        </button>
      </div>
      <p className="sidebar-title">{title}</p>
      <nav className="sidebar-nav">
        {items.map(({ label, path, icon }) => (
          <SidebarItem
            key={`${label}-${path}`}
<<<<<<< Updated upstream
            label={label}
            path={path}
            icon={icon}
            onNavigate={onClose}
          />
=======
            to={path}
            onClick={onClose}
            title={isCollapsed ? label : undefined}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
>>>>>>> Stashed changes
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <strong>{user?.fullName}</strong>
            <small>
              {user?.role === 'STUDENT' ? 'طالب' : user?.role === 'INSTRUCTOR' ? 'محاضر' : 'مشرف'}
            </small>
          </div>
        </div>
        <Button variant="ghost" fullWidth size="sm" onClick={onLogout} icon={<LogOut size={16} />}>
          تسجيل الخروج
        </Button>
      </div>
    </aside>
  );
}
