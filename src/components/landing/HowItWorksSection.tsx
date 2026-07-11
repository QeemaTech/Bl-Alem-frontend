import { useLandingLocale } from '../../hooks/useLandingLocale';
import { HOW_IT_WORKS_META } from './landingData';
import { Icon } from '../ui/Icon';

export default function HowItWorksSection() {
  const { t } = useLandingLocale();
  const steps = t('howItWorks.steps', { returnObjects: true }) as Array<{ title: string; desc: string }>;

  return (
    <section className="lp-section" style={{ background: 'white' }}>
      <div className="lp-container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="lp-badge">{t('howItWorks.badge')}</div>
          <h2 className="lp-section-title" style={{ margin: '0 auto 14px' }}>
            {t('howItWorks.title')}
          </h2>
          <p className="lp-section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
            {t('howItWorks.desc')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 22,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 60,
            insetInlineStart: '12.5%',
            insetInlineEnd: '12.5%',
            height: 2,
            background: 'linear-gradient(90deg, #22A6BC, #168CA0, #22A6BC)',
            opacity: 0.25,
            borderRadius: 2,
            zIndex: 0,
            pointerEvents: 'none',
          }} />

          {steps.map((step, index) => {
            const meta = HOW_IT_WORKS_META[index];
            return (
              <div key={step.title} className="lp-step-card" style={{ zIndex: 1 }}>
                <div className="lp-step-number">{index + 1}</div>
                <div style={{
                  width: 48, height: 48,
                  borderRadius: 14,
                  background: '#EAF8FB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Icon name={meta.icon} size={24} style={{ color: '#22A6BC' }} filled />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.7 }}>
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
