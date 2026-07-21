import { useTranslation } from 'react-i18next';

const QEEMA_URL = 'https://www.qeematech.net/';
const QEEMA_LOGO = '/branding/qeema-tech.png';

interface PoweredByQeemaProps {
  variant?: 'default' | 'landing';
}

export function PoweredByQeema({ variant = 'default' }: PoweredByQeemaProps) {
  const { t } = useTranslation('common');
  const isLanding = variant === 'landing';

  return (
    <div
      className={isLanding ? 'powered-by-qeema powered-by-qeema-landing' : 'powered-by-qeema'}
      aria-label={t('poweredBy.aria')}
    >
      <a
        href={QEEMA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="powered-by-qeema-link"
        title={t('poweredBy.title')}
      >
        <span className="powered-by-qeema-text">{t('poweredBy.label')}</span>
        <img
          src={QEEMA_LOGO}
          alt={t('poweredBy.logoAlt')}
          className="powered-by-qeema-logo"
          width={88}
          height={36}
          loading="lazy"
        />
      </a>
    </div>
  );
}
