import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import type { MaterialIcon } from '@/icons';
import { Header } from '../components/dashboard/Header';
import { Sidebar } from '../components/dashboard/Sidebar';
import { useAuth } from '../store/AuthContext';

const COLLAPSE_KEY = 'bi-alem-sidebar-collapsed';

interface DashboardLayoutProps {
  title: string;
  sidebarTitle: string;
  items: { label: string; path: string; icon: MaterialIcon }[];
  notificationsPath?: string;
  profilePath?: string;
}

export default function DashboardLayout({
  title,
  sidebarTitle,
  items,
  notificationsPath,
  profilePath,
}: DashboardLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem(COLLAPSE_KEY) === 'true';
  });
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  return (
    <div className={`dashboard-shell ${isCollapsed ? 'is-collapsed' : ''}`}>
      <Sidebar
        title={sidebarTitle}
        items={items}
        isOpen={isOpen}
        isCollapsed={isCollapsed}
        onClose={() => setIsOpen(false)}
        onToggleCollapse={toggleCollapse}
        onLogout={handleLogout}
      />
      {isOpen ? (
        <button className="drawer-backdrop" aria-label="إغلاق القائمة" onClick={() => setIsOpen(false)} />
      ) : null}
      <main className="dashboard-main">
        <Header
          title={title}
          notificationsPath={notificationsPath}
          profilePath={profilePath}
          onMenuClick={() => setIsOpen(true)}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
