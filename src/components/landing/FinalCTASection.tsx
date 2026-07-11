import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { getDashboardPath } from '../../utils/roleRedirect';
import { useLandingLocale } from '../../hooks/useLandingLocale';
import { Icon } from '../ui/Icon';

export default function FinalCTASection() {
  const { t } = useLandingLocale();
  const { user, isAuthenticated } = useAuth();
  const trustItems = t('cta.trust', { returnObjects: true }) as string[];

  return (
    <section className="lp-cta-bg lp-section-sm">
      <div className="lp-container">
        <div style={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          maxWidth: 680,
          margin: '0 auto',
        }}>
          <div style={{
            width: 72, height: 72,
            borderRadius: 22,
            background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            border: '1px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(8px)',
          }}>
            <Icon name="school" size={36} style={{ color: 'white' }} filled />
          </div>

          <h2 style={{
            fontSize: 'clamp(1.7rem, 4.5vw, 2.5rem)',
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.3,
            marginBottom: 18,
            letterSpacing: '-0.01em',
          }}>
            {t('cta.title')}
          </h2>

          <p style={{
            fontSize: '1.05rem',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.8,
            marginBottom: 36,
          }}>
            {t('cta.desc')}
          </p>

          {isAuthenticated ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Link to={getDashboardPath(user?.role)} className="lp-btn-white">
                <Icon name="dashboard" size={20} style={{ color: '#22A6BC' }} />
                {t('cta.goDashboard')}
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="lp-btn-white">
                <Icon name="person_add" size={20} style={{ color: '#22A6BC' }} />
                {t('cta.register')}
              </Link>
              <Link to="/login" className="lp-btn-outline-white">
                <Icon name="login" size={20} style={{ color: 'white' }} />
                {t('cta.login')}
              </Link>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 28,
            marginTop: 40,
          }}>
            {[
              { icon: 'check_circle', text: trustItems[0] },
              { icon: 'security', text: trustItems[1] },
              { icon: 'support_agent', text: trustItems[2] },
            ].map(item => (
              <div key={item.text} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                color: 'rgba(255,255,255,0.85)',
              }}>
                <Icon name={item.icon} size={18} style={{ color: 'rgba(255,255,255,0.9)' }} filled />
                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
