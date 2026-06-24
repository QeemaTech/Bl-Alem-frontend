import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, DarkMode, LightMode, LogOut, Menu, UserRound } from '@/icons';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';

interface HeaderProps {
  title: string;
  notificationsPath?: string;
  profilePath?: string;
  onMenuClick: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Header({
  title,
  notificationsPath,
  profilePath,
  onMenuClick,
}: HeaderProps) {
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

  const initials = user?.fullName?.split(' ').map((w) => w[0]).slice(0, 2).join('') || '؟';

  return (
    <>
      <header className="dashboard-header">
        <Button variant="ghost" className="menu-btn" onClick={onMenuClick} aria-label="القائمة">
          <Menu size={20} />
        </Button>
        <div className="dashboard-header-title">
          <h1>{title}</h1>
          <p>مرحباً {user?.fullName || 'بك'}، تابع يومك التعليمي من هنا.</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={resolvedTheme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
          >
            {resolvedTheme === 'dark' ? <LightMode size={20} /> : <DarkMode size={20} />}
          </button>
          {notificationsPath ? (
            <Link to={notificationsPath} className="icon-btn" aria-label="الإشعارات">
              <Bell size={20} />
            </Link>
          ) : (
            <button type="button" className="icon-btn" aria-label="الإشعارات">
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
                    <UserRound size={16} /> الملف الشخصي
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="dropdown-item danger"
                  onClick={() => { setDropdownOpen(false); setLogoutOpen(true); }}
                >
                  <LogOut size={16} /> تسجيل الخروج
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <ConfirmDialog
        isOpen={logoutOpen}
        title="تسجيل الخروج"
        message="هل أنت متأكد من تسجيل الخروج؟"
        confirmLabel="خروج"
        variant="primary"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />
    </>
  );
}
