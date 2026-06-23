import type { LucideIcon } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { BrandMark } from '../ui/BrandMark';
import { useAuth } from '../../store/AuthContext';
import { SidebarItem } from './SidebarItem';

interface SidebarProps {
  title: string;
  items: { label: string; path: string; icon: LucideIcon }[];
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({ title, items, isOpen, onClose, onLogout }: SidebarProps) {
  const { user } = useAuth();
  const initials = user?.fullName?.split(' ').map((w) => w[0]).slice(0, 2).join('') || '؟';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <BrandMark variant="sidebar" />
      <p className="sidebar-title">{title}</p>
      <nav className="sidebar-nav">
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
          <div className="sidebar-user-info">
            <strong>{user?.fullName}</strong>
            <small>{user?.role === 'STUDENT' ? 'طالب' : user?.role === 'INSTRUCTOR' ? 'محاضر' : 'مشرف'}</small>
          </div>
        </div>
        <Button variant="ghost" fullWidth size="sm" onClick={onLogout} icon={<LogOut size={16} />}>
          تسجيل الخروج
        </Button>
      </div>
    </aside>
  );
}
