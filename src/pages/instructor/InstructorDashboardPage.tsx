import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clock,
  LiveTv,
  Play,
  PlusCircle,
  Radio,
  Reviews,
  Star,
  TrendingDown,
  TrendingUp,
  UsersRound,
  Wallet,
} from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../store/AuthContext';
import { formatDate, formatTime } from '../../utils/localeFormat';
import { formatMoney } from '../../utils/formatMoney';
import { mediaUrl } from '../../utils/mediaUrl';

function ReviewStars({ rating, ariaLabel }: { rating: number; ariaLabel: string }) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <span className="latest-review-stars" aria-label={ariaLabel}>
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < value;
        return (
          <Star
            key={index}
            size={14}
            className={filled ? 'review-star is-filled' : 'review-star'}
            {...(filled ? { fill: 'currentColor' } : {})}
            aria-hidden="true"
          />
        );
      })}
    </span>
  );
}

export default function InstructorDashboardPage() {
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const quickActions = useMemo(() => [
    { label: t('instructor.quickActions.addCourse'), description: t('instructor.quickActions.addCourseDesc'), href: '/instructor/courses/create', icon: PlusCircle },
    { label: t('instructor.quickActions.myCourses'), description: t('instructor.quickActions.myCoursesDesc'), href: '/instructor/courses', icon: BookOpen },
    { label: t('instructor.quickActions.liveSession'), description: t('instructor.quickActions.liveSessionDesc'), href: '/instructor/live', icon: Radio },
    { label: t('instructor.quickActions.earnings'), description: t('instructor.quickActions.earningsDesc'), href: '/instructor/earnings', icon: Wallet },
  ], [t]);

  useEffect(() => {
    instructorApi.dashboard().then(setData).finally(() => setLoading(false));
  }, []);

  const startSession = async (sessionId: number) => {
    try {
      await instructorApi.startLiveSession(sessionId);
      showToast(t('instructor.session.startSuccess'), 'success');
      instructorApi.dashboard().then(setData);
    } catch {
      showToast(t('instructor.session.startFail'), 'error');
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (data?.approvalStatus === 'PENDING') {
    return (
      <div className="page-grid instructor-dashboard-page">
        <PageHeader title={t('instructor.homeTitle')} subtitle={t('instructor.homeSubtitle')} />
        <Card className="notice-card pending">
          <div>
            <Badge variant="pending">{tc('status.pending')}</Badge>
            <h2>{t('instructor.approval.pendingTitle')}</h2>
            <p>{t('instructor.approval.pendingDesc')}</p>
          </div>
          <Link to="/instructor/profile"><Button>{tc('actions.completeProfile')}</Button></Link>
        </Card>
        <Card>
          <EmptyState
            title={t('instructor.approval.coursesDisabledTitle')}
            description={t('instructor.approval.coursesDisabledDesc')}
            icon={Clock}
          />
        </Card>
      </div>
    );
  }

  if (data?.approvalStatus === 'REJECTED') {
    return (
      <div className="page-grid instructor-dashboard-page">
        <PageHeader title={t('instructor.homeTitle')} subtitle={t('instructor.homeSubtitle')} />
        <Card className="notice-card rejected">
          <div>
            <Badge variant="rejected">{tc('status.rejected')}</Badge>
            <h2>{t('instructor.approval.rejectedTitle')}</h2>
            <p>{data.rejectionReason || t('instructor.approval.rejectedDesc')}</p>
          </div>
          <Link to="/instructor/profile"><Button>{tc('actions.editProfileResubmit')}</Button></Link>
        </Card>
      </div>
    );
  }

  const growth = Number(data?.growthPercentage || 0);
  const growthUp = growth >= 0;
  const GrowthIcon = growthUp ? TrendingUp : TrendingDown;
  const firstName = user?.fullName?.split(' ')[0];

  return (
    <div className="page-grid instructor-dashboard-page">
      <div className="reports-header instructor-dashboard-header">
        <PageHeader
          title={t('instructor.homeTitle')}
          subtitle={firstName ? t('instructor.welcomeNamed', { name: firstName }) : t('instructor.welcomeDefault')}
        />
        <div className="reports-header-actions">
          <Link to="/instructor/courses/create">
            <Button icon={<PlusCircle size={18} />}>{t('instructor.addCourse')}</Button>
          </Link>
        </div>
      </div>

      <section className="instructor-dash-hero" aria-label={t('instructor.sections.welcome')}>
        <div className="instructor-dash-hero-text">
          <span className="instructor-dash-hero-badge">{t('instructor.heroBadge')}</span>
          <h2>{t('instructor.heroTitle')}</h2>
          <p>{t('instructor.heroDesc')}</p>
        </div>
        <div className="instructor-dash-hero-actions">
          <Link to="/instructor/live">
            <Button variant="secondary" icon={<LiveTv size={18} />}>{t('instructor.liveSession')}</Button>
          </Link>
        </div>
      </section>

      <Card className="instructor-dash-growth" elevation={1}>
        <div className="instructor-dash-growth-body">
          <p className="instructor-dash-growth-label">{t('instructor.growthLabel')}</p>
          <div className="instructor-dash-growth-value">
            <strong className={growthUp ? 'is-up' : 'is-down'}>
              {growthUp ? `+${growth}%` : `${growth}%`}
            </strong>
            <span>{t('instructor.growthDesc')}</span>
          </div>
        </div>
        <div className={`instructor-dash-growth-icon${growthUp ? '' : ' is-down'}`} aria-hidden>
          <GrowthIcon size={40} />
        </div>
      </Card>

      <div className="stats-grid instructor-dashboard-stats">
        <StatCard title={t('instructor.stats.monthEarnings')} value={formatMoney(data?.monthEarnings)} icon={Wallet} />
        <StatCard title={t('instructor.stats.students')} value={String(data?.totalStudents || 0)} icon={UsersRound} />
        <StatCard title={t('instructor.stats.published')} value={String(data?.publishedCourses || 0)} icon={BookOpen} />
        <StatCard
          title={t('instructor.stats.upcomingSessions')}
          value={String(data?.upcomingLiveSessions?.length || 0)}
          icon={Calendar}
        />
      </div>

      <section className="instructor-dash-actions" aria-label={t('instructor.quickActions.title')}>
        <header className="instructor-dash-section-head">
          <h2>{t('instructor.quickActions.title')}</h2>
          <p>{t('instructor.quickActions.subtitle')}</p>
        </header>
        <div className="instructor-dash-actions-grid">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} to={action.href} className="instructor-dash-action-card">
                <div className="instructor-dash-action-icon" aria-hidden>
                  <Icon size={22} />
                </div>
                <div>
                  <strong>{action.label}</strong>
                  <p>{action.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="content-grid wide instructor-dashboard-split">
        <Card className="instructor-dashboard-panel">
          <div className="section-heading">
            <h2>
              <span className="instructor-dash-section-icon" aria-hidden>
                <Calendar size={20} />
              </span>
              {t('instructor.sections.todaySessions')}
            </h2>
            <Link to="/instructor/live">
              <Button variant="ghost" size="sm">{tc('actions.viewAll')}</Button>
            </Link>
          </div>
          {data?.todayLiveSessions?.length ? (
            <div className="instructor-dash-list">
              {data.todayLiveSessions.map((s: any) => (
                <div key={s.id} className="instructor-dash-row">
                  <div className="instructor-dash-row-icon" aria-hidden>
                    <LiveTv size={20} />
                  </div>
                  <div className="instructor-dash-row-info">
                    <h4>{s.titleAr}</h4>
                    <p>
                      {s.course?.titleAr}
                      {' — '}
                      {formatTime(s.startAt, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge variant={s.status === 'LIVE' ? 'live' : 'pending'}>
                    {s.status === 'LIVE' ? tc('status.live') : tc('status.upcoming')}
                  </Badge>
                  <Button size="sm" onClick={() => startSession(s.id)} icon={<Play size={16} />}>
                    {t('instructor.session.start')}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t('instructor.empty.noSessionsToday')}
              description={t('instructor.empty.noSessionsTodayDesc')}
              icon={Calendar}
            />
          )}
        </Card>

        <Card className="instructor-dashboard-panel">
          <div className="section-heading">
            <h2>
              <span className="instructor-dash-section-icon" aria-hidden>
                <TrendingUp size={20} />
              </span>
              {t('instructor.sections.bestSelling')}
            </h2>
            <Link to="/instructor/courses">
              <Button variant="ghost" size="sm">{tc('actions.viewAll')}</Button>
            </Link>
          </div>
          {data?.bestSellingCourses?.length ? (
            <div className="instructor-dash-list">
              {data.bestSellingCourses.map((c: any) => (
                <div key={c.id} className="instructor-dash-row is-static">
                  <div className="instructor-dash-row-icon" aria-hidden>
                    <BookOpen size={20} />
                  </div>
                  <div className="instructor-dash-row-info">
                    <h4>{c.titleAr}</h4>
                    <p>
                      {t('instructor.sales.salesAndStudents', {
                        sales: c.salesCount,
                        students: c.enrollments,
                      })}
                    </p>
                  </div>
                  <strong className="instructor-dash-revenue">{formatMoney(c.revenue)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t('instructor.empty.noSales')}
              description={t('instructor.empty.noSalesDesc')}
              icon={BookOpen}
            />
          )}
        </Card>
      </div>

      <Card className="instructor-dashboard-reviews">
        <div className="section-heading latest-reviews-header">
          <h2>
            <span className="instructor-dash-section-icon" aria-hidden>
              <Reviews size={20} />
            </span>
            {t('instructor.sections.latestReviews')}
          </h2>
          <Link to="/instructor/reviews">
            <Button variant="ghost" size="sm">{tc('actions.viewAll')}</Button>
          </Link>
        </div>
        {data?.latestReviews?.length ? (
          <div className="latest-reviews-list">
            {data.latestReviews.map((r: any) => (
              <div key={r.id} className="latest-review-item">
                <div className="latest-review-course-thumb">
                  {r.course?.coverImage ? (
                    <img src={mediaUrl(r.course.coverImage)} alt="" />
                  ) : (
                    <BookOpen size={18} />
                  )}
                </div>
                <div className="latest-review-body">
                  <div className="latest-review-top">
                    <div className="latest-review-meta">
                      <strong>{r.user?.fullName}</strong>
                      <ReviewStars
                        rating={r.rating}
                        ariaLabel={t('instructor.reviews.starsAria', { rating: r.rating })}
                      />
                    </div>
                    <span className="latest-review-score">{r.rating}/5</span>
                  </div>
                  {r.course?.titleAr ? (
                    <Link to={`/instructor/courses/${r.course.id}/edit`} className="latest-review-course">
                      {r.course.titleAr}
                    </Link>
                  ) : null}
                  {r.comment ? (
                    <p className="latest-review-comment">{r.comment}</p>
                  ) : null}
                  <span className="latest-review-date">
                    {formatDate(r.createdAt, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('instructor.empty.noReviews')}
            description={t('instructor.empty.noReviewsDesc')}
            icon={Reviews}
          />
        )}
      </Card>
    </div>
  );
}
