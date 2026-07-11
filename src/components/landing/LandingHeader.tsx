import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { getDashboardPath } from '../../utils/roleRedirect';
import { useLandingLocale } from '../../hooks/useLandingLocale';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
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

export default function LandingHeader() {
  const { t } = useLandingLocale();
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(href);
    }
  };

  const dashboardPath = isAuthenticated && user ? getDashboardPath(user.role) : '/login';

  return (
    <>
      <header className={`lp-header${scrolled ? ' scrolled' : ''}`}>
        <div className="lp-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
            <Link
              to="/"
              style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}
            >
              <PlatformLogo alt={t('brand.name')} height={50} variant="landing" />
            </Link>

            <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="lp-desktop-nav">
              {NAV_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => handleNavClick(NAV_HREFS[key])}
                  className="lp-nav-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {t(`header.nav.${key}`)}
                </button>
              ))}
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <LanguageSwitcher variant="toggle" />

              {!isLoading && (
                isAuthenticated ? (
                  <Link to={dashboardPath} className="lp-btn-primary" style={{ fontSize: '0.86rem', padding: '9px 18px' }}>
                    <Icon name="dashboard" size={17} style={{ color: 'white' }} />
                    {t('header.dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="lp-btn-secondary" style={{ fontSize: '0.86rem', padding: '9px 18px' }}>
                      {t('header.login')}
                    </Link>
                    <Link to="/register" className="lp-btn-primary" style={{ fontSize: '0.86rem', padding: '9px 18px' }}>
                      {t('header.register')}
                    </Link>
                  </>
                )
              )}

              <button
                onClick={() => setMobileOpen(true)}
                className="lp-mobile-menu-btn"
                style={{
                  background: 'none', border: '1px solid #E6EEF2', borderRadius: 10,
                  width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#334155', flexShrink: 0,
                }}
                aria-label={t('header.openMenu')}
              >
                <Icon name="menu" size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="lp-mobile-overlay">
          <div className="lp-mobile-backdrop" onClick={() => setMobileOpen(false)} />
          <div className="lp-mobile-drawer" ref={drawerRef}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 20px',
              borderBottom: '1px solid #E6EEF2',
            }}>
              <PlatformLogo alt={t('brand.name')} height={44} variant="landing" />
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  background: '#F1F5F9', border: 'none', borderRadius: 8,
                  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#64748B',
                }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div style={{ padding: '12px 12px', flex: 1 }}>
              {NAV_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => handleNavClick(NAV_HREFS[key])}
                  className="lp-mobile-nav-link"
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {t(`header.nav.${key}`)}
                </button>
              ))}
            </div>

            <div style={{ padding: '16px 16px 24px', borderTop: '1px solid #E6EEF2', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                <LanguageSwitcher />
              </div>
              {isAuthenticated ? (
                <Link
                  to={dashboardPath}
                  className="lp-btn-primary"
                  onClick={() => setMobileOpen(false)}
                  style={{ justifyContent: 'center', fontSize: '0.95rem' }}
                >
                  <Icon name="dashboard" size={18} style={{ color: 'white' }} />
                  {t('header.dashboard')}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="lp-btn-secondary"
                    onClick={() => setMobileOpen(false)}
                    style={{ justifyContent: 'center', fontSize: '0.95rem' }}
                  >
                    {t('header.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="lp-btn-primary"
                    onClick={() => setMobileOpen(false)}
                    style={{ justifyContent: 'center', fontSize: '0.95rem' }}
                  >
                    {t('header.registerFree')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .lp-mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 767px) {
          .lp-desktop-nav { display: none !important; }
        }
      `}</style>
    </>
  );
}
