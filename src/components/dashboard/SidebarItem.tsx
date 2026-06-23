import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  label: string;
  path: string;
  icon: LucideIcon;
  onNavigate?: () => void;
}

export function SidebarItem({ label, path, icon: Icon, onNavigate }: SidebarItemProps) {
  return (
    <NavLink
      to={path}
      onClick={onNavigate}
      className={({ isActive }) => `sidebar-item ${isActive ? 'is-active' : ''}`}
    >
      <span className="sidebar-item-icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <span className="sidebar-item-label">{label}</span>
    </NavLink>
  );
}
