import { mediaUrl } from '../../utils/mediaUrl';
import { splitPlatformName } from '../../utils/theme';
import { useSiteSettings } from '../../store/SiteSettingsContext';

interface BrandMarkProps {
  variant?: 'sidebar' | 'auth' | 'compact';
}

export function BrandMark({ variant = 'sidebar' }: BrandMarkProps) {
  const { settings } = useSiteSettings();
  const logoSrc = mediaUrl(settings.logo);
  const { title, subtitle } = splitPlatformName(settings.platformName);

  return (
    <div className={`brand brand-mark brand-mark-${variant}`}>
      {logoSrc ? (
        <img src={logoSrc} alt={settings.platformName} className="brand-mark-logo" />
      ) : (
        <div className="brand-mark-text">
          <span>{title}</span>
          <small>{subtitle}</small>
        </div>
      )}
    </div>
  );
}
