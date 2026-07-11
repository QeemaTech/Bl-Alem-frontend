import { useLandingLocale } from '../../hooks/useLandingLocale';
import { ADMIN_FEATURE_ICONS } from './landingData';
import { Icon } from '../ui/Icon';

function AdminDashboardPreview() {
  const { t } = useLandingLocale();

  return (
    <div style={{ maxWidth: 420 }}>
      <div style={{
        background: 'linear-gradient(145deg, #F8FAFC 0%, #EAF8FB 100%)',
        borderRadius: 24, padding: 20,
        boxShadow: '0 20px 60px rgba(34,166,188,0.12)',
      }}>
        <div style={{
          background: 'white',
          borderRadius: 14, padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14,
          boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'linear-gradient(135deg, #22A6BC, #168CA0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="admin_panel_settings" size={17} style={{ color: 'white' }} filled />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{t('admin.preview.title')}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: '0.65rem', color: '#64748B' }}>{t('admin.preview.live')}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[
            { val: '10.2K', label: t('admin.preview.students'), color: '#22A6BC', bg: '#EAF8FB' },
            { val: '523', label: t('admin.preview.courses'), color: '#7C3AED', bg: '#F5F3FF' },
            { val: '127', label: t('admin.preview.instructors'), color: '#059669', bg: '#D1FAE5' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'white', borderRadius: 12, padding: '12px 10px',
              textAlign: 'center',
              border: `1px solid ${s.bg}`,
              boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '0.6rem', color: '#64748B', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'white', borderRadius: 14, padding: '14px 16px',
          marginBottom: 12,
          boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>{t('admin.preview.monthlyRevenue')}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#22C55E' }}>{t('admin.preview.growth')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 50 }}>
            {[40, 65, 50, 80, 70, 90, 75].map((h, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{
                  height: `${h}%`, borderRadius: '4px 4px 0 0',
                  background: i === 5
                    ? 'linear-gradient(180deg, #22A6BC, #168CA0)'
                    : 'rgba(34,166,188,0.2)',
                }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { icon: 'rate_review', text: t('admin.preview.pendingCourses'), color: '#D97706', bg: '#FEF3C7' },
            { icon: 'payments', text: t('admin.preview.pendingWithdrawals'), color: '#7C3AED', bg: '#F5F3FF' },
          ].map(item => (
            <div key={item.text} style={{
              background: 'white', borderRadius: 12, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
              border: '1px solid #E6EEF2',
              boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, background: item.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon name={item.icon} size={16} style={{ color: item.color }} filled />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminManagementSection() {
  const { t } = useLandingLocale();
  const features = t('admin.features', { returnObjects: true }) as Array<{ title: string; desc: string }>;

  return (
    <section className="lp-section lp-section-alt">
      <div className="lp-container">
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="lp-badge">{t('admin.badge')}</div>
          <h2 className="lp-section-title" style={{ margin: '0 auto 14px' }}>
            {t('admin.titlePrefix')}{' '}
            <span className="lp-text-gradient">{t('admin.titleHighlight')}</span>
          </h2>
          <p className="lp-section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
            {t('admin.desc')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 48,
          alignItems: 'center',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}>
            {features.map((feat, index) => (
              <div key={feat.title} className="lp-admin-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div className="lp-icon-circle" style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0 }}>
                    <Icon name={ADMIN_FEATURE_ICONS[index]} size={20} style={{ color: '#22A6BC' }} filled />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: 5 }}>
                      {feat.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.65 }}>
                      {feat.desc}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <AdminDashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
