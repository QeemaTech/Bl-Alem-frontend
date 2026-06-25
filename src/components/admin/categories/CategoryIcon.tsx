import { Icon } from '../../ui/Icon';

const iconMap: Record<string, string> = {
  megaphone: 'campaign',
  briefcase: 'work',
};

function resolveIconName(slug?: string | null) {
  if (!slug) return 'category';
  const normalized = slug.trim().toLowerCase();
  return iconMap[normalized] || normalized;
}

interface CategoryIconProps {
  icon?: string | null;
  size?: number;
  className?: string;
  filled?: boolean;
}

export function CategoryIcon({ icon, size = 20, className, filled }: CategoryIconProps) {
  return (
    <span className={`category-icon-display ${className || ''}`.trim()}>
      <Icon name={resolveIconName(icon)} size={size} filled={filled} />
    </span>
  );
}
