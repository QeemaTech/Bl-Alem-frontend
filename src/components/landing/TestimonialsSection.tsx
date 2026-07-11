import { useLandingLocale } from '../../hooks/useLandingLocale';
import { TESTIMONIAL_META } from './landingData';
import { Icon } from '../ui/Icon';

function StarRating({ count }: { count: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Icon key={i} name="star" size={16} style={{ color: '#E6A817' }} filled />
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const { t } = useLandingLocale();
  const items = t('testimonials.items', { returnObjects: true }) as Array<{
    name: string;
    role: string;
    tag: string;
    text: string;
  }>;

  return (
    <section className="lp-section" style={{ background: 'white' }}>
      <div className="lp-container">
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="lp-badge">{t('testimonials.badge')}</div>
          <h2 className="lp-section-title" style={{ margin: '0 auto 14px' }}>
            {t('testimonials.title')}
          </h2>
          <p className="lp-section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
            {t('testimonials.desc')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 22,
        }}>
          {items.map((item, index) => {
            const meta = TESTIMONIAL_META[index];
            return (
              <div key={item.name} className="lp-testimonial-card">
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: '#EAF8FB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Icon name="format_quote" size={20} style={{ color: '#22A6BC' }} filled />
                </div>

                <StarRating count={5} />

                <p style={{
                  fontSize: '0.92rem',
                  color: '#334155',
                  lineHeight: 1.8,
                  marginBottom: 24,
                }}>
                  "{item.text}"
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44,
                    borderRadius: '50%',
                    background: meta.avatarColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'white',
                  }}>
                    {meta.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.role}</div>
                  </div>
                  <span style={{
                    marginInlineStart: 'auto',
                    fontSize: '0.68rem', fontWeight: 700,
                    color: meta.tagColor, background: meta.tagBg,
                    padding: '3px 10px', borderRadius: 100,
                  }}>
                    {item.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 48,
          background: '#EAF8FB',
          borderRadius: 20,
          padding: '28px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          border: '1px solid rgba(34,166,188,0.2)',
        }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
              {t('testimonials.bannerTitle')}
            </div>
            <div style={{ fontSize: '0.88rem', color: '#64748B' }}>
              {t('testimonials.bannerDesc')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {[
              { val: '+95%', label: t('testimonials.satisfaction') },
              { val: '+10K', label: t('testimonials.activeStudents') },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22A6BC' }}>{s.val}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
