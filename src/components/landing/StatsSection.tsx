import { useLandingLocale } from '../../hooks/useLandingLocale';
import { STAT_META } from './landingData';
import { Icon } from '../ui/Icon';

export default function StatsSection() {
  const { t } = useLandingLocale();
  const stats = t('stats.items', { returnObjects: true }) as Array<{ value: string; label: string }>;

  return (
    <section className="lp-section-sm" style={{ background: 'white' }}>
      <div className="lp-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
        }}>
          {stats.map((stat, index) => {
            const meta = STAT_META[index];
            return (
              <div key={stat.label} className="lp-stat-card">
                <div style={{
                  width: 60, height: 60, borderRadius: 18,
                  background: meta.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Icon name={meta.icon} size={28} style={{ color: meta.color }} filled />
                </div>
                <div style={{
                  fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
                  fontWeight: 800,
                  color: meta.color,
                  lineHeight: 1,
                  marginBottom: 8,
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
