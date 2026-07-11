import { DEFAULT_PLATFORM_LOGO } from '../../utils/branding';

interface PlatformLogoProps {
  alt?: string;
  className?: string;
  height?: number;
  variant?: 'default' | 'landing';
}

export function PlatformLogo({
  alt = 'BI-ALEM / بالعِلم',
  className,
  height = 44,
  variant = 'default',
}: PlatformLogoProps) {
  const shellClass = variant === 'landing' ? 'platform-logo-shell platform-logo-shell-landing' : 'platform-logo-shell';

  return (
    <span className={shellClass}>
      <img
        src={DEFAULT_PLATFORM_LOGO}
        alt={alt}
        className={className}
        style={{ height, width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
      />
    </span>
  );
}
