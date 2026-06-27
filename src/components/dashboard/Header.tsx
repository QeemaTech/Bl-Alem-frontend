import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronDown, DarkMode, LightMode, LogOut, Menu, UserRound } from '@/icons';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';

interface HeaderProps {
  title: string;
  greetingKey?: string;
  notificationsPath?: string;
  profilePath?: string;
  onMenuClick: () => void;
}

export function Header({
  title,
  greetingKey = 'header.greeting',
  notificationsPath,
  profilePath,
  onMenuClick,
}: HeaderProps) {
  const { t } = useTranslation('common');
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const initials = user?.fullName?.split(' ').map((w) => w[0]).slice(0, 2).join('') || t('sidebar.unknownInitial');
  const greetingName = user?.fullName || t('header.greetingFallback');

  return (
    <>
      <header className="dashboard-header">
        <button
          type="button"
          className="icon-btn dashboard-menu-mobile"
          onClick={onMenuClick}
          aria-label={t('sidebar.openMenu')}
        >
          <Menu size={20} />
        </button>
        <div className="dashboard-header-title">
          <h1>{title}</h1>
          <p>{t(greetingKey, { name: greetingName })}</p>
        </div>
        <div className="header-actions">
          <LanguageSwitcher />
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={resolvedTheme === 'dark' ? t('theme.light') : t('theme.dark')}
          >
            {resolvedTheme === 'dark' ? <LightMode size={20} /> : <DarkMode size={20} />}
          </button>
          {notificationsPath ? (
            <Link to={notificationsPath} className="icon-btn" aria-label={t('header.notifications')}>
              <Bell size={20} />
            </Link>
          ) : (
            <button type="button" className="icon-btn" aria-label={t('header.notifications')}>
              <Bell size={20} />
            </button>
          )}
          <div className="profile-dropdown" ref={dropdownRef}>
            <button type="button" className="profile-chip" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <span className="profile-chip-avatar">{initials}</span>
              <span>{user?.fullName}</span>
              <ChevronDown size={16} />
            </button>
            {dropdownOpen ? (
              <div className="dropdown-menu">
                {profilePath ? (
                  <Link to={profilePath} className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <UserRound size={16} /> {t('header.profile')}
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="dropdown-item danger"
                  onClick={() => { setDropdownOpen(false); setLogoutOpen(true); }}
                >
                  <LogOut size={16} /> {t('actions.logout')}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <ConfirmDialog
        isOpen={logoutOpen}
        title={t('dialog.logoutTitle')}
        message={t('dialog.logoutMessage')}
        confirmLabel={t('dialog.logoutConfirm')}
        variant="primary"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />
    </>
  );
}
