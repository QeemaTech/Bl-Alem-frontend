import { resolvePlatformLogo } from '../../utils/branding';
import { useSiteSettings } from '../../store/SiteSettingsContext';

interface BrandMarkProps {
  variant?: 'sidebar' | 'auth' | 'compact';
}

export function BrandMark({ variant = 'sidebar' }: BrandMarkProps) {
  const { settings } = useSiteSettings();
  const logoSrc = resolvePlatformLogo(settings.logo);

  return (
    <div className={`brand brand-mark brand-mark-${variant}`}>
      {variant === 'auth' ? (
        <div className="brand-mark-auth-shell">
          <img src={logoSrc} alt={settings.platformName} className="brand-mark-logo" />
        </div>
      ) : (
        <img src={logoSrc} alt={settings.platformName} className="brand-mark-logo" />
      )}
    </div>
  );
}
