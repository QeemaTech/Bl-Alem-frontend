import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from '@/icons';
import { BrandMark } from '../../ui/BrandMark';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
}

export function SidebarHeader({ isCollapsed, onToggleCollapse }: SidebarHeaderProps) {
  const { t } = useTranslation('common');

  return (
    <div className="sidebar-brand">
      <BrandMark variant="sidebar" />
      {onToggleCollapse ? (
        <button
          type="button"
          className="sidebar-collapse-trigger"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      ) : null}
    </div>
  );
}
