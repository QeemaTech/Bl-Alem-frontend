import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useAuth } from '../../../store/AuthContext';
import { instructorNavSections } from './instructorNavConfig';
import { SidebarFooter } from './SidebarFooter';
import { SidebarHeader } from './SidebarHeader';
import { SidebarProfile } from './SidebarProfile';
import { SidebarSection } from './SidebarSection';
import { useInstructorSidebarBadges } from './useInstructorSidebarBadges';

function pathMatches(itemPath: string, pathname: string) {
  if (pathname === itemPath) return true;
  const prefix = itemPath.endsWith('/') ? itemPath : `${itemPath}/`;
  return pathname.startsWith(prefix);
}

interface InstructorSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  profilePath: string;
  onClose: () => void;
  onLogout: () => void;
  onToggleCollapse?: () => void;
}

export function InstructorSidebar({
  isOpen,
  isCollapsed,
  profilePath,
  onClose,
  onLogout,
  onToggleCollapse,
}: InstructorSidebarProps) {
  const { t } = useTranslation('nav');
  const { t: tu } = useTranslation('users');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const { pathname } = useLocation();
  const touchStartX = useRef<number | null>(null);
  const badges = useInstructorSidebarBadges();

  const initials = user?.fullName?.split(' ').map((w) => w[0]).slice(0, 2).join('') || tc('sidebar.unknownInitial');
  const collapsed = isCollapsed && !isOpen;

  const allItems = useMemo(
    () => instructorNavSections.flatMap((section) => section.items),
    [],
  );

  const activePath = useMemo(() => {
    const matches = allItems
      .map((item) => item.path)
      .filter((path) => pathMatches(path, pathname));
    if (!matches.length) return null;
    return matches.reduce((best, path) => (path.length > best.length ? path : best));
  }, [allItems, pathname]);

  const badgeCounts = useMemo(
    () => ({ live: 0, notifications: badges.notifications, rewards: 0 }),
    [badges.notifications],
  );

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (touchStartX.current === null || !isOpen) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    const isLtr = document.documentElement.dir === 'ltr';
    const shouldClose = isLtr ? delta < -56 : delta > 56;
    if (shouldClose) onClose();
    touchStartX.current = null;
  }, [isOpen, onClose]);

  return (
    <aside
      className={cn('sidebar student-sidebar', isOpen && 'open', collapsed && 'is-collapsed')}
      aria-label={t('aria.instructorSidebar')}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <SidebarHeader isCollapsed={collapsed} onToggleCollapse={onToggleCollapse} />

      <nav className="sidebar-nav" aria-label={t('aria.instructorNav')}>
        {instructorNavSections.map((section, index) => (
          <SidebarSection
            key={section.id}
            sectionId={section.id}
            labelKey={section.labelKey}
            items={section.items}
            activePath={activePath}
            collapsed={collapsed}
            badgeCounts={badgeCounts}
            onNavigate={onClose}
            showDivider={index > 0}
          />
        ))}
      </nav>

      <div className="sidebar-footer">
        <SidebarProfile
          fullName={user?.fullName}
          roleLabel={tu('roles.instructor')}
          initials={initials}
          profilePath={profilePath}
          collapsed={collapsed}
          onNavigate={onClose}
        />
        <SidebarFooter collapsed={collapsed} onLogout={onLogout} />
      </div>
    </aside>
  );
}
