import { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { Outlet, useNavigate } from 'react-router-dom';

import type { MaterialIcon } from '@/icons';

import { PlatformStatusBanner } from '../components/platform/PlatformStatusBanner';

import { Header } from '../components/dashboard/Header';

import { Sidebar } from '../components/dashboard/Sidebar';

import { InstructorSidebar } from '../components/dashboard/sidebar/InstructorSidebar';

import { StudentSidebar } from '../components/dashboard/sidebar/StudentSidebar';

import { useAuth } from '../store/AuthContext';



const COLLAPSE_KEY = 'bi-alem-sidebar-collapsed';



interface DashboardLayoutProps {

  title: string;

  sidebarTitleKey: string;

  items: { labelKey: string; path: string; icon: MaterialIcon }[];

  notificationsPath?: string;

  profilePath?: string;

  platformBanner?: 'student' | 'admin';

  sidebarVariant?: 'default' | 'student' | 'instructor';

  greetingKey?: string;

}



export default function DashboardLayout({

  title,

  sidebarTitleKey,

  items,

  notificationsPath,

  profilePath,

  platformBanner,

  sidebarVariant = 'default',

  greetingKey = 'header.greeting',

}: DashboardLayoutProps) {

  const { t } = useTranslation('common');

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

      {sidebarVariant === 'student' ? (

        <StudentSidebar

          isOpen={isOpen}

          isCollapsed={isCollapsed && !isOpen}

          profilePath={profilePath || '/student/profile'}

          onClose={() => setIsOpen(false)}

          onLogout={handleLogout}

          onToggleCollapse={toggleCollapse}

        />

      ) : sidebarVariant === 'instructor' ? (

        <InstructorSidebar

          isOpen={isOpen}

          isCollapsed={isCollapsed && !isOpen}

          profilePath={profilePath || '/instructor/profile'}

          onClose={() => setIsOpen(false)}

          onLogout={handleLogout}

          onToggleCollapse={toggleCollapse}

        />

      ) : (

        <Sidebar

          titleKey={sidebarTitleKey}

          items={items}

          isOpen={isOpen}

          isCollapsed={isCollapsed && !isOpen}

          onClose={() => setIsOpen(false)}

          onLogout={handleLogout}

          onToggleCollapse={toggleCollapse}

        />

      )}

      {isOpen ? (

        <button className="drawer-backdrop" aria-label={t('sidebar.closeDrawer')} onClick={() => setIsOpen(false)} />

      ) : null}

      <main className="dashboard-main">

        <Header

          title={title}

          greetingKey={greetingKey}

          notificationsPath={notificationsPath}

          profilePath={profilePath}

          onMenuClick={() => setIsOpen(true)}

        />

        <div className="dashboard-content">

          {platformBanner ? <PlatformStatusBanner variant={platformBanner} /> : null}

          <Outlet />

        </div>

      </main>

    </div>

  );

}

