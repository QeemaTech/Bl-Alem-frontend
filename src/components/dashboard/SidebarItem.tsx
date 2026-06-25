import { NavLink } from 'react-router-dom';
import type { MaterialIcon } from '@/icons';
import { cn } from '@/lib/cn';

interface SidebarItemProps {
  label: string;
  path: string;
  icon: MaterialIcon;
  onNavigate?: () => void;
}

export function SidebarItem({ label, path, icon: Icon, onNavigate }: SidebarItemProps) {
  const end = path.split('/').filter(Boolean).length <= 2;

  return (
    <NavLink
      to={path}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => cn('sidebar-item', isActive && 'is-active')}
      title={label}
    >
      {({ isActive }) => (
        <>
          <span className="sidebar-item-icon" aria-hidden="true">
            <Icon size={22} fill={isActive ? 'currentColor' : undefined} />
          </span>
          <span className="sidebar-item-label">{label}</span>
        </>
      )}
    </NavLink>
  );
}
