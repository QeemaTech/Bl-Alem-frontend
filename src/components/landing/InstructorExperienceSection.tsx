import { Link } from 'react-router-dom';
import { useLandingLocale } from '../../hooks/useLandingLocale';
import { INSTRUCTOR_STEP_ICONS } from './landingData';
import { Icon } from '../ui/Icon';

function InstructorPreviewCard() {
  const { t, dir } = useLandingLocale();
  const courseItems = t('instructor.preview.courseItems', { returnObjects: true }) as Array<{
    name: string;
    students: string;
    status: string;
  }>;

  return (
    <div style={{ maxWidth: 400, direction: dir }}>
      <div className="lp-mockup-outer" style={{ background: 'linear-gradient(140deg, #1E293B 0%, #0F172A 100%)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14, padding: '4px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #22A6BC, #168CA0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="cast_for_education" size={16} style={{ color: 'white' }} filled />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>{t('instructor.preview.title')}</span>
          </div>
          <span style={{
            fontSize: '0.65rem', color: '#94A3B8',
            background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 6,
          }}>{t('instructor.preview.currentMonth')}</span>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #22A6BC 0%, #168CA0 100%)',
          borderRadius: 14, padding: '16px 18px', marginBottom: 12,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -15, insetInlineStart: -15, width: 80, height: 80,
            borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
          }} />
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>{t('instructor.preview.totalEarnings')}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>
            4,850 <span style={{ fontSize: '0.9rem' }}>{t('instructor.preview.currency')}</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
            <Icon name="trending_up" size={12} style={{ verticalAlign: 'middle', marginInlineEnd: 3 }} />
            {t('instructor.preview.growth')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {[
            { label: t('instructor.preview.students'), value: '243', icon: 'group', color: '#22A6BC', bg: 'rgba(34,166,188,0.15)' },
            { label: t('instructor.preview.courses'), value: '7', icon: 'menu_book', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={s.icon} size={15} style={{ color: s.color }} filled />
                </div>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>{s.value}</div>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {courseItems.map(course => (
          <div key={course.name} style={{
            background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px',
            marginBottom: 8, border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'white', marginBottom: 2 }}>{course.name}</div>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{course.students} {t('instructor.preview.students')}</div>
            </div>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700,
              color: course.status === t('instructor.preview.statusPublished') ? '#22C55E' : '#F59E0B',
              background: course.status === t('instructor.preview.statusPublished') ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
              padding: '3px 10px', borderRadius: 100,
            }}>{course.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InstructorExperienceSection() {
  const { t } = useLandingLocale();
  const steps = t('instructor.steps', { returnObjects: true }) as string[];

  return (
    <section id="instructors" className="lp-section lp-section-alt">
      <div className="lp-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 64,
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', order: 2 }}>
            <InstructorPreviewCard />
          </div>

          <div style={{ order: 1 }}>
            <div className="lp-badge">{t('instructor.badge')}</div>
            <h2 className="lp-section-title" style={{ marginBottom: 16 }}>
              {t('instructor.titlePrefix')}{' '}
              <span className="lp-text-gradient">{t('instructor.titleHighlight')}</span>
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.8, marginBottom: 28 }}>
              {t('instructor.desc')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 32 }}>
              {steps.map((step, i) => (
                <div key={i} className="lp-check-item">
                  <div className="lp-check-icon">
                    <Icon name={INSTRUCTOR_STEP_ICONS[i]} size={14} style={{ color: '#22A6BC' }} filled />
                  </div>
                  <span style={{ fontSize: '0.93rem', color: '#334155', fontWeight: 500 }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <Link to="/register?role=INSTRUCTOR" className="lp-btn-primary lg">
              <Icon name="cast_for_education" size={20} style={{ color: 'white' }} filled />
              {t('instructor.cta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
