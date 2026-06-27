import { useTranslation } from 'react-i18next';
import { LogOut } from '@/icons';
import { Button } from '../../ui/Button';

interface SidebarFooterProps {
  collapsed: boolean;
  onLogout: () => void;
}

export function SidebarFooter({ collapsed, onLogout }: SidebarFooterProps) {
  const { t } = useTranslation('common');
  const logoutLabel = t('actions.logout');

  return (
    <div className="sidebar-logout-area">
      {!collapsed ? (
        <Button
          variant="ghost"
          fullWidth
          size="sm"
          onClick={onLogout}
          icon={<LogOut size={18} />}
          className="sidebar-logout-btn"
        >
          {logoutLabel}
        </Button>
      ) : (
        <button
          type="button"
          className="sidebar-logout-icon"
          onClick={onLogout}
          aria-label={logoutLabel}
          data-tooltip={logoutLabel}
        >
          <LogOut size={20} />
        </button>
      )}
    </div>
  );
}
