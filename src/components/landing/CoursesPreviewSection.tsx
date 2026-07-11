import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { getDashboardPath } from '../../utils/roleRedirect';
import { useLandingLocale } from '../../hooks/useLandingLocale';
import { STATIC_COURSE_META } from './landingData';
import { Icon } from '../ui/Icon';

interface CourseItem {
  id: number;
  title: string;
  instructorName: string;
  category: string;
  rating: number;
  lessonsCount: number;
  price: number;
  discount?: number;
  coverColor: string;
  coverIcon: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Icon
          key={i}
          name="star"
          size={14}
          style={{ color: i <= Math.round(rating) ? '#E6A817' : '#CBD5E1' }}
          filled
        />
      ))}
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginInlineStart: 4 }}>
        ({rating})
      </span>
    </div>
  );
}

function CourseCard({ course }: { course: CourseItem }) {
  const { t } = useLandingLocale();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role === 'STUDENT') {
      navigate(`/student/courses/${course.id}`);
    } else {
      navigate(getDashboardPath(user?.role));
    }
  };

  return (
    <div className="lp-course-card" onClick={handleClick}>
      <div style={{
        height: 140,
        background: course.coverColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -20, insetInlineEnd: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <Icon name={course.coverIcon} size={52} style={{ color: 'white', opacity: 0.9 }} filled />
        <span style={{
          position: 'absolute', top: 12, insetInlineEnd: 12,
          fontSize: '0.68rem', fontWeight: 700,
          color: 'white', background: 'rgba(255,255,255,0.2)',
          padding: '3px 10px', borderRadius: 100,
          backdropFilter: 'blur(8px)',
        }}>
          {course.category}
        </span>
        {course.discount && (
          <span style={{
            position: 'absolute', top: 12, insetInlineStart: 12,
            fontSize: '0.68rem', fontWeight: 700,
            color: '#DC2626', background: '#FEF2F2',
            padding: '3px 8px', borderRadius: 100,
          }}>
            {t('courses.discount')}
          </span>
        )}
      </div>

      <div style={{ padding: '16px 18px' }}>
        <h3 style={{
          fontSize: '0.92rem', fontWeight: 700, color: '#0F172A',
          marginBottom: 6, lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {course.title}
        </h3>

        <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: 10 }}>
          {course.instructorName}
        </p>

        <StarRating rating={course.rating} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, marginBottom: 14 }}>
          <Icon name="video_library" size={14} style={{ color: '#64748B' }} />
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            {course.lessonsCount} {t('courses.lessons')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {course.discount ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22A6BC' }}>
                  {course.discount} {t('courses.currency')}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                  {course.price} {t('courses.currency')}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22A6BC' }}>
                {course.price} {t('courses.currency')}
              </span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleClick(); }}
            style={{
              fontSize: '0.75rem', fontWeight: 700,
              color: '#22A6BC', background: '#EAF8FB',
              border: 'none', padding: '6px 12px', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
          >
            {t('courses.details')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoursesPreviewSection() {
  const { t, lang } = useLandingLocale();

  const defaultCourses = useMemo(() => {
    const staticItems = t('courses.items', { returnObjects: true }) as Array<{
      title: string;
      instructorName: string;
      category: string;
    }>;
    return STATIC_COURSE_META.map((meta, index) => ({
      ...meta,
      ...staticItems[index],
    }));
  }, [lang, t]);

  const [apiCourses, setApiCourses] = useState<CourseItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setApiCourses(null);

    fetch('/api/landing/featured-courses')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data?.data?.length) return;
        setApiCourses(data.data.map((item: CourseItem, index: number) => ({
          ...STATIC_COURSE_META[index % STATIC_COURSE_META.length],
          ...item,
        })));
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [lang]);

  const courses = apiCourses ?? defaultCourses;

  return (
    <section id="courses" className="lp-section lp-section-alt">
      <div className="lp-container">
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="lp-badge">{t('courses.badge')}</div>
          <h2 className="lp-section-title" style={{ margin: '0 auto 14px', maxWidth: 600 }}>
            {t('courses.title')}
          </h2>
          <p className="lp-section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
            {t('courses.desc')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 22,
          marginBottom: 40,
        }}>
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: 16 }}>
            {t('courses.loginHint')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/login" className="lp-btn-secondary">
              <Icon name="login" size={18} style={{ color: '#22A6BC' }} />
              {t('courses.ctaLogin')}
            </Link>
            <Link to="/register" className="lp-btn-primary">
              <Icon name="school" size={18} style={{ color: 'white' }} filled />
              {t('courses.ctaRegister')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
