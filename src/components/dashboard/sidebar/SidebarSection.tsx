import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import type { SidebarNavItem } from './types';
import { SidebarItem } from './SidebarItem';

interface SidebarSectionProps {
  sectionId: string;
  labelKey?: string;
  items: SidebarNavItem[];
  activePath: string | null;
  collapsed: boolean;
  badgeCounts?: Record<string, number>;
  onNavigate?: () => void;
  showDivider?: boolean;
}

function resolveBadge(
  item: SidebarNavItem,
  badgeCounts?: Record<string, number>,
): number | undefined {
  if (!item.badgeKey || !badgeCounts) return undefined;
  const count = badgeCounts[item.badgeKey];
  return count > 0 ? count : undefined;
}

export function SidebarSection({
  sectionId,
  labelKey,
  items,
  activePath,
  collapsed,
  badgeCounts,
  onNavigate,
  showDivider = false,
}: SidebarSectionProps) {
  const { t } = useTranslation('nav');
  const label = labelKey ? t(labelKey) : undefined;

  if (!items.length) return null;

  return (
    <div className={cn('sidebar-section', showDivider && 'has-divider')}>
      {label && !collapsed ? (
        <p className="sidebar-section-label" id={`sidebar-section-${sectionId}`}>
          {label}
        </p>
      ) : null}
      <div
        className="sidebar-section-items"
        role="group"
        aria-labelledby={label && !collapsed ? `sidebar-section-${sectionId}` : undefined}
      >
        {items.map((item) => (
          <SidebarItem
            key={`${item.labelKey}-${item.path}`}
            labelKey={item.labelKey}
            path={item.path}
            icon={item.icon}
            active={item.path === activePath}
            collapsed={collapsed}
            badge={resolveBadge(item, badgeCounts)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}
