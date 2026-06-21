import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Header } from '../components/dashboard/Header';
import { Sidebar } from '../components/dashboard/Sidebar';
import { useAuth } from '../store/AuthContext';

interface DashboardLayoutProps {
  title: string;
  sidebarTitle: string;
  items: { label: string; path: string; icon: LucideIcon }[];
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
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-shell">
      <Sidebar
        title={sidebarTitle}
        items={items}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
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
        />
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
