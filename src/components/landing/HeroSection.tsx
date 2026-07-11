import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { getDashboardPath } from '../../utils/roleRedirect';
import { useLandingLocale } from '../../hooks/useLandingLocale';
import { Icon } from '../ui/Icon';

function DashboardMockup() {
  const { t, dir } = useLandingLocale();

  return (
    <div className="lp-mockup-outer lp-float-1" style={{ direction: dir, maxWidth: 460 }}>
      <div style={{
        background: '#0F172A', borderRadius: 14, padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
        </div>
        <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>{t('hero.mockup.title')}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ width: 20, height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.3)' }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        {[
          { icon: 'menu_book', val: '12', label: t('hero.mockup.myCourses'), color: '#EAF8FB', iconColor: '#22A6BC' },
          { icon: 'workspace_premium', val: '5', label: t('hero.mockup.myCertificates'), color: '#FEF3C7', iconColor: '#D97706' },
        ].map(stat => (
          <div key={stat.label} className="lp-mockup-card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: stat.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name={stat.icon} size={18} style={{ color: stat.iconColor }} filled />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>{stat.val}</div>
              <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="lp-mockup-card" style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, marginBottom: 4 }}>{t('hero.mockup.currentCourse')}</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{t('hero.mockup.courseTitle')}</div>
            <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{t('hero.mockup.instructor')}</div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #22A6BC, #168CA0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="play_circle" size={24} style={{ color: 'white' }} filled />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B' }}>{t('hero.mockup.progress')}</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#22A6BC' }}>68%</span>
        </div>
        <div className="lp-progress">
          <div className="lp-progress-fill" style={{ width: '68%' }} />
        </div>
        <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: 6 }}>{t('hero.mockup.lessonProgress')}</div>
      </div>

      <div className="lp-mockup-card" style={{
        background: 'linear-gradient(135deg, #FEF2F2, #FFF5F5)',
        borderColor: 'rgba(220, 38, 38, 0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)',
            }}>
              <Icon name="live_tv" size={18} style={{ color: '#DC2626' }} filled />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>{t('hero.mockup.liveToday')}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748B' }}>{t('hero.mockup.liveTime')}</div>
            </div>
          </div>
          <span className="lp-live-badge">
            <span className="lp-live-dot" />
            {t('hero.mockup.live')}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const { t } = useLandingLocale();
  const { user, isAuthenticated } = useAuth();
  const miniCards = t('hero.miniCards', { returnObjects: true }) as string[];

  return (
    <section id="home" className="lp-hero-bg lp-section" style={{ paddingTop: 80, paddingBottom: 80 }}>
      <div className="lp-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 64,
          alignItems: 'center',
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="lp-badge">
              <Icon name="auto_awesome" size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} filled />
              {t('hero.badge')}
            </div>

            <h1 style={{
              fontSize: 'clamp(1.9rem, 5vw, 2.8rem)',
              fontWeight: 800,
              color: '#0F172A',
              lineHeight: 1.25,
              marginBottom: 20,
              letterSpacing: '-0.02em',
            }}>
              {t('hero.titlePrefix')}{' '}
              <span className="lp-text-gradient">{t('hero.titleHighlight')}</span>{' '}
              {t('hero.titleSuffix')}
            </h1>

            <p style={{
              fontSize: '1.05rem',
              color: '#475569',
              lineHeight: 1.8,
              marginBottom: 32,
              maxWidth: 520,
            }}>
              {t('hero.subtitle')}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 36 }}>
              {isAuthenticated ? (
                <Link to={getDashboardPath(user?.role)} className="lp-btn-primary lg">
                  <Icon name="dashboard" size={20} style={{ color: 'white' }} />
                  {t('header.dashboard')}
                </Link>
              ) : (
                <>
                  <Link to="/register" className="lp-btn-primary lg">
                    <Icon name="rocket_launch" size={20} style={{ color: 'white' }} filled />
                    {t('hero.ctaStudent')}
                  </Link>
                  <Link to="/register?role=INSTRUCTOR" className="lp-btn-secondary lg">
                    <Icon name="person_add" size={20} style={{ color: '#22A6BC' }} />
                    {t('hero.ctaInstructor')}
                  </Link>
                </>
              )}
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 20 }}>
              {t('hero.trustText')}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[
                { icon: 'school', color: '#22A6BC' },
                { icon: 'play_circle', color: '#168CA0' },
                { icon: 'live_tv', color: '#0E7A93' },
                { icon: 'workspace_premium', color: '#22A6BC' },
              ].map((item, index) => (
                <div key={index} className="lp-mini-card">
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: '#EAF8FB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={item.icon} size={14} style={{ color: item.color }} filled />
                  </div>
                  {miniCards[index]}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <DashboardMockup />

            <div className="lp-mini-card lp-float-2" style={{
              position: 'absolute', top: -16, insetInlineEnd: -12,
              background: 'white', zIndex: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, #22A6BC, #168CA0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="trending_up" size={16} style={{ color: 'white' }} />
              </div>
              <span style={{ color: '#22A6BC' }}>{t('hero.floatProgress')}</span>
            </div>

            <div className="lp-mini-card lp-float-3" style={{
              position: 'absolute', bottom: 20, insetInlineStart: -16,
              background: 'white', zIndex: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: '#FEF3C7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="workspace_premium" size={16} style={{ color: '#D97706' }} filled />
              </div>
              <span style={{ color: '#D97706' }}>{t('hero.floatCertificate')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
