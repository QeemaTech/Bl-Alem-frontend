import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Settings } from '@/icons';
import { cn } from '@/lib/cn';

interface SidebarProfileProps {
  fullName?: string;
  roleLabel: string;
  initials: string;
  profilePath: string;
  collapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarProfile({
  fullName,
  roleLabel,
  initials,
  profilePath,
  collapsed,
  onNavigate,
}: SidebarProfileProps) {
  const { t } = useTranslation('common');
  const profileLabel = t('sidebar.profile');
  const userFallback = t('sidebar.user');

  if (collapsed) {
    return (
      <Link
        to={profilePath}
        onClick={onNavigate}
        className="sidebar-profile sidebar-profile--collapsed"
        aria-label={t('sidebar.profileOf', { name: fullName || userFallback })}
        data-tooltip={fullName || profileLabel}
      >
        <span className="sidebar-profile-avatar">{initials}</span>
        <span className="sidebar-profile-online" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <div className={cn('sidebar-profile')}>
      <Link
        to={profilePath}
        onClick={onNavigate}
        className="sidebar-profile-main"
        aria-label={profileLabel}
      >
        <span className="sidebar-profile-avatar-wrap">
          <span className="sidebar-profile-avatar">{initials}</span>
          <span className="sidebar-profile-online" aria-hidden="true" title={t('status.online')} />
        </span>
        <span className="sidebar-profile-info">
          <strong>{fullName}</strong>
          <span className="sidebar-profile-role">{roleLabel}</span>
        </span>
      </Link>
      <Link
        to={profilePath}
        onClick={onNavigate}
        className="sidebar-profile-settings"
        aria-label={t('sidebar.profileSettings')}
      >
        <Settings size={18} />
      </Link>
    </div>
  );
}
