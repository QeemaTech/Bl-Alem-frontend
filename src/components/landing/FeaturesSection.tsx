import { useLandingLocale } from '../../hooks/useLandingLocale';
import { FEATURE_META } from './landingData';
import { Icon } from '../ui/Icon';

export default function FeaturesSection() {
  const { t } = useLandingLocale();
  const features = t('features.items', { returnObjects: true }) as Array<{ title: string; desc: string }>;

  return (
    <section id="features" className="lp-section lp-section-alt">
      <div className="lp-container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="lp-badge">{t('features.badge')}</div>
          <h2 className="lp-section-title" style={{ margin: '0 auto 14px', maxWidth: 600 }}>
            {t('features.title')}
          </h2>
          <p className="lp-section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
            {t('features.desc')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 22,
        }}>
          {features.map((feat, index) => {
            const meta = FEATURE_META[index];
            return (
              <div key={feat.title} className="lp-feature-card">
                <div className="lp-icon-circle" style={{ background: meta.bg, color: meta.color, marginBottom: 18 }}>
                  <Icon name={meta.icon} size={26} style={{ color: meta.color }} filled />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.75 }}>
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
