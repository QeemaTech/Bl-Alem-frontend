import { Link } from 'react-router-dom';
import { useLandingLocale } from '../../hooks/useLandingLocale';
import { LIVE_BENEFIT_ICONS } from './landingData';
import { Icon } from '../ui/Icon';

function LivePreviewCard() {
  const { t, isArabic } = useLandingLocale();

  return (
    <div style={{ maxWidth: 400 }}>
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: 22,
        padding: 24,
        boxShadow: '0 24px 64px rgba(15, 23, 42, 0.25)',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8' }}>{t('live.preview.upcoming')}</span>
          <span className="lp-live-badge">
            <span className="lp-live-dot" />
            {t('live.preview.live')}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #22A6BC, #168CA0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="live_tv" size={26} style={{ color: 'white' }} filled />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white', lineHeight: 1.4 }}>
              {t('live.preview.title')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 }}>{t('live.preview.instructor')}</div>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 10, marginBottom: 18,
        }}>
          {[
            { icon: 'calendar_today', label: t('live.preview.dateLabel'), val: t('live.preview.date') },
            { icon: 'schedule', label: t('live.preview.timeLabel'), val: t('live.preview.time') },
          ].map(item => (
            <div key={item.label} style={{
              background: 'rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '10px 14px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Icon name={item.icon} size={13} style={{ color: '#22A6BC' }} />
                <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>{item.label}</span>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>{item.val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex' }}>
              {['#22A6BC', '#168CA0', '#7C3AED', '#059669'].map((color, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: color,
                  border: '2px solid #1E293B',
                  marginInlineStart: i === 0 ? 0 : -8,
                }} />
              ))}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginInlineStart: 6 }}>{t('live.preview.enrolled')}</span>
          </div>
          <span style={{
            fontSize: '0.7rem', fontWeight: 700,
            color: '#22C55E', background: 'rgba(34,197,94,0.15)',
            padding: '3px 10px', borderRadius: 100,
          }}>{t('live.preview.freeForSubscribers')}</span>
        </div>

        <Link to="/login" className="lp-btn-primary" style={{ width: '100%', justifyContent: 'center', borderRadius: 12 }}>
          <Icon name="live_tv" size={17} style={{ color: 'white' }} filled />
          {t('live.preview.cta')}
        </Link>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #E6EEF2',
        borderRadius: 16, padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 16px rgba(34,166,188,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#EAF8FB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="event_upcoming" size={18} style={{ color: '#22A6BC' }} filled />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F172A' }}>{t('live.preview.upcomingCount')}</div>
            <div style={{ fontSize: '0.65rem', color: '#64748B' }}>{t('live.preview.upcomingHint')}</div>
          </div>
        </div>
        <Icon name={isArabic ? 'arrow_back_ios' : 'arrow_forward_ios'} size={14} style={{ color: '#22A6BC' }} />
      </div>
    </div>
  );
}

export default function LiveSessionsSection() {
  const { t } = useLandingLocale();
  const benefits = t('live.benefits', { returnObjects: true }) as string[];

  return (
    <section className="lp-section lp-section-alt">
      <div className="lp-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 64,
          alignItems: 'center',
        }}>
          <div>
            <div className="lp-badge">{t('live.badge')}</div>
            <h2 className="lp-section-title" style={{ marginBottom: 16 }}>
              {t('live.titlePrefix')}{' '}
              <span className="lp-text-gradient">{t('live.titleHighlight')}</span>
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.8, marginBottom: 32 }}>
              {t('live.desc')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
              {benefits.map((text, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'white',
                  border: '1px solid #E6EEF2',
                  borderRadius: 14,
                  padding: '14px 18px',
                }}>
                  <div className="lp-icon-circle" style={{ width: 44, height: 44, borderRadius: 12 }}>
                    <Icon name={LIVE_BENEFIT_ICONS[i]} size={20} style={{ color: '#22A6BC' }} filled />
                  </div>
                  <span style={{ fontSize: '0.93rem', fontWeight: 500, color: '#334155' }}>{text}</span>
                </div>
              ))}
            </div>

            <Link to="/login" className="lp-btn-secondary lg">
              <Icon name="live_tv" size={20} style={{ color: '#22A6BC' }} filled />
              {t('live.cta')}
            </Link>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <LivePreviewCard />
          </div>
        </div>
      </div>
    </section>
  );
}
