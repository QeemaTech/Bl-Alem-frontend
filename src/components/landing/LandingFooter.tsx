import { Link } from 'react-router-dom';
import { useLandingLocale } from '../../hooks/useLandingLocale';
import { PoweredByQeema } from '../branding/PoweredByQeema';
import { PlatformLogo } from '../ui/PlatformLogo';
import { Icon } from '../ui/Icon';

const NAV_KEYS = ['home', 'features', 'courses', 'students', 'instructors', 'faq'] as const;
const NAV_HREFS: Record<(typeof NAV_KEYS)[number], string> = {
  home: '#home',
  features: '#features',
  courses: '#courses',
  students: '#students',
  instructors: '#instructors',
  faq: '#faq',
};

const ACCOUNT_LINK_KEYS = [
  { key: 'login', href: '/login' },
  { key: 'registerStudent', href: '/register?role=STUDENT' },
  { key: 'registerInstructor', href: '/register?role=INSTRUCTOR' },
  { key: 'verifyCertificate', href: '/certificates/verify' },
] as const;

export default function LandingFooter() {
  const { t } = useLandingLocale();

  const scrollTo = (href: string) => {
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="lp-footer">
      <div className="lp-container" style={{ padding: '64px 28px 40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 40,
          marginBottom: 48,
        }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ marginBottom: 16 }}>
              <PlatformLogo alt={t('brand.name')} height={56} variant="landing" />
            </div>

            <p style={{
              fontSize: '0.875rem',
              color: '#94A3B8',
              lineHeight: 1.75,
              marginBottom: 24,
            }}>
              {t('footer.desc')}
            </p>

            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { icon: 'language', label: t('footer.social.website') },
                { icon: 'mail', label: t('footer.social.email') },
              ].map(social => (
                <a
                  key={social.icon}
                  href="mailto:support@bialem.com"
                  style={{
                    width: 36, height: 36,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s ease',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    color: '#94A3B8',
                  }}
                  title={social.label}
                >
                  <Icon name={social.icon} size={16} style={{ color: '#94A3B8' }} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'white', marginBottom: 16 }}>
              {t('footer.quickLinks')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {NAV_KEYS.map(key => (
                <button
                  key={key}
                  onClick={() => scrollTo(NAV_HREFS[key])}
                  className="lp-footer-link"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'start',
                    color: '#94A3B8',
                  }}
                >
                  {t(`header.nav.${key}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'white', marginBottom: 16 }}>
              {t('footer.account')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {ACCOUNT_LINK_KEYS.map(link => (
                <Link key={link.key} to={link.href} className="lp-footer-link">
                  {t(`footer.accountLinks.${link.key}`)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'white', marginBottom: 16 }}>
              {t('footer.contact')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="mailto:support@bialem.com" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                color: '#94A3B8', textDecoration: 'none',
                fontSize: '0.875rem', transition: 'color 0.2s ease',
              }}>
                <Icon name="mail" size={16} style={{ color: '#22A6BC', flexShrink: 0 }} />
                support@bialem.com
              </a>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#64748B' }}>
                <Icon name="schedule" size={16} style={{ color: '#22A6BC', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.82rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {t('footer.supportHours')}
                </span>
              </div>
            </div>

            <div style={{
              marginTop: 20,
              background: 'rgba(34,166,188,0.1)',
              border: '1px solid rgba(34,166,188,0.2)',
              borderRadius: 14,
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: 6 }}>{t('footer.trusted')}</div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#22A6BC' }}>+10K</div>
                  <div style={{ fontSize: '0.62rem', color: '#64748B' }}>{t('footer.students')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#22A6BC' }}>+500</div>
                  <div style={{ fontSize: '0.62rem', color: '#64748B' }}>{t('footer.courses')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            {t('footer.copyright')}
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[t('footer.privacy'), t('footer.terms')].map(item => (
              <span key={item} style={{ fontSize: '0.78rem', color: '#64748B', cursor: 'pointer', transition: 'color 0.2s ease' }}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
          <PoweredByQeema variant="landing" />
        </div>
      </div>
    </footer>
  );
}
