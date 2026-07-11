import { Link } from 'react-router-dom';
import { useLandingLocale } from '../../hooks/useLandingLocale';
import { STUDENT_STEP_ICONS } from './landingData';
import { Icon } from '../ui/Icon';

function StudentPreviewCard() {
  const { t } = useLandingLocale();

  return (
    <div style={{ position: 'relative', maxWidth: 380 }}>
      <div className="lp-mockup-card" style={{
        borderRadius: 22, padding: 22,
        boxShadow: '0 20px 60px rgba(34,166,188,0.15)',
      }}>
        <div style={{
          height: 110, borderRadius: 14, marginBottom: 16,
          background: 'linear-gradient(135deg, #22A6BC 0%, #168CA0 50%, #0E7A93 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -20, insetInlineEnd: -20,
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }} />
          <Icon name="play_circle" size={44} style={{ color: 'white' }} filled />
          <span className="lp-live-badge" style={{ position: 'absolute', top: 10, insetInlineEnd: 10 }}>
            <span className="lp-live-dot" />
            {t('student.preview.liveNow')}
          </span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', flex: 1, lineHeight: 1.4 }}>
              {t('student.preview.courseTitle')}
            </h4>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, color: '#22A6BC',
              background: '#EAF8FB', padding: '2px 8px', borderRadius: 100,
              flexShrink: 0, marginInlineStart: 8,
            }}>{t('student.preview.category')}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{t('student.preview.instructor')}</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B' }}>{t('student.preview.progressLabel')}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#22A6BC' }}>75%</span>
          </div>
          <div className="lp-progress">
            <div className="lp-progress-fill" style={{ width: '75%' }} />
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: 5 }}>{t('student.preview.lessonProgress')}</div>
        </div>

        <div style={{
          background: '#F0FBFD', borderRadius: 12, padding: '10px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="schedule" size={16} style={{ color: '#22A6BC' }} filled />
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0F172A' }}>{t('student.preview.nextSession')}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748B' }}>{t('student.preview.nextSessionTime')}</div>
            </div>
          </div>
          <div style={{
            fontSize: '0.65rem', fontWeight: 700,
            color: '#22A6BC', background: 'white',
            padding: '4px 10px', borderRadius: 100,
            boxShadow: '0 1px 4px rgba(34,166,188,0.2)',
          }}>{t('student.preview.registerAttendance')}</div>
        </div>
      </div>

      <div className="lp-mini-card lp-float-2" style={{
        position: 'absolute', bottom: -14, insetInlineStart: -14,
        background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
        color: 'white', zIndex: 10,
      }}>
        <Icon name="workspace_premium" size={16} style={{ color: 'white' }} filled />
        <span style={{ color: 'white', fontSize: '0.78rem' }}>{t('student.preview.certificateReady')}</span>
      </div>
    </div>
  );
}

export default function StudentExperienceSection() {
  const { t } = useLandingLocale();
  const steps = t('student.steps', { returnObjects: true }) as string[];

  return (
    <section id="students" className="lp-section" style={{ background: 'white' }}>
      <div className="lp-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 64,
          alignItems: 'center',
        }}>
          <div>
            <div className="lp-badge">{t('student.badge')}</div>
            <h2 className="lp-section-title" style={{ marginBottom: 16 }}>
              {t('student.titlePrefix')}{' '}
              <span className="lp-text-gradient">{t('student.titleHighlight')}</span>
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.8, marginBottom: 28 }}>
              {t('student.desc')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 32 }}>
              {steps.map((step, i) => (
                <div key={i} className="lp-check-item">
                  <div className="lp-check-icon">
                    <Icon name={STUDENT_STEP_ICONS[i]} size={14} style={{ color: '#22A6BC' }} filled />
                  </div>
                  <span style={{ fontSize: '0.93rem', color: '#334155', fontWeight: 500 }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <Link to="/register?role=STUDENT" className="lp-btn-primary lg">
              <Icon name="school" size={20} style={{ color: 'white' }} filled />
              {t('student.cta')}
            </Link>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <StudentPreviewCard />
          </div>
        </div>
      </div>
    </section>
  );
}
