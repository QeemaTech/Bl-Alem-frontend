import { useLandingLocale } from '../../hooks/useLandingLocale';
import { CERT_FEATURE_ICONS, REWARD_FEATURE_ICONS } from './landingData';
import { Icon } from '../ui/Icon';

export default function CertificatesRewardsSection() {
  const { t } = useLandingLocale();
  const certFeatures = t('certificates.certFeatures', { returnObjects: true }) as string[];
  const rewardFeatures = t('certificates.rewardFeatures', { returnObjects: true }) as string[];

  return (
    <section className="lp-section" style={{ background: 'white' }}>
      <div className="lp-container">
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="lp-badge">{t('certificates.badge')}</div>
          <h2 className="lp-section-title" style={{ margin: '0 auto 14px' }}>
            {t('certificates.title')}
          </h2>
          <p className="lp-section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
            {t('certificates.desc')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}>
          <div className="lp-cert-card">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 54, height: 54, borderRadius: 16,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
              }}>
                <Icon name="workspace_premium" size={28} style={{ color: 'white' }} filled />
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>
                {t('certificates.certTitle')}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 24 }}>
                {t('certificates.certDesc')}
              </p>

              <div className="lp-feature-list">
                {certFeatures.map((text, i) => (
                  <div key={i} className="lp-feature-list-item">
                    <div className="lp-feature-list-icon lp-feature-list-icon--light">
                      <Icon name={CERT_FEATURE_ICONS[i]} size={16} style={{ color: 'white' }} filled />
                    </div>
                    <span className="lp-feature-list-text">{text}</span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 24,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 14,
                padding: '14px 16px',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{t('certificates.certPreviewLabel')}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'white' }}>{t('certificates.certPreviewTitle')}</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                    {t('certificates.certPreviewNumber')}
                  </div>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="verified" size={24} style={{ color: 'white' }} filled />
                </div>
              </div>
            </div>
          </div>

          <div className="lp-reward-card">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 54, height: 54, borderRadius: 16,
                background: 'rgba(34,166,188,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
              }}>
                <Icon name="military_tech" size={28} style={{ color: '#22A6BC' }} filled />
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>
                {t('certificates.rewardTitle')}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 24 }}>
                {t('certificates.rewardDesc')}
              </p>

              <div className="lp-feature-list">
                {rewardFeatures.map((text, i) => (
                  <div key={i} className="lp-feature-list-item">
                    <div className="lp-feature-list-icon lp-feature-list-icon--reward">
                      <Icon name={REWARD_FEATURE_ICONS[i]} size={16} style={{ color: '#22A6BC' }} filled />
                    </div>
                    <span className="lp-feature-list-text lp-feature-list-text--reward">{text}</span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 24,
                background: 'rgba(34,166,188,0.15)',
                borderRadius: 14,
                padding: '14px 16px',
                border: '1px solid rgba(34,166,188,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginBottom: 2 }}>{t('certificates.referralLabel')}</div>
                  <div style={{
                    fontSize: '1rem', fontWeight: 800, color: '#22A6BC',
                    letterSpacing: '0.08em',
                  }}>BIALEM-XXXX</div>
                </div>
                <div style={{
                  background: 'rgba(34,166,188,0.2)',
                  borderRadius: 10, padding: '8px 14px',
                  fontSize: '0.72rem', fontWeight: 700, color: '#22A6BC', cursor: 'pointer',
                }}>{t('certificates.copy')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
