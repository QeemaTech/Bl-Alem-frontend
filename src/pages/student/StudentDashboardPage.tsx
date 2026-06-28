import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Award, Bell, BookOpen, Calendar, Copy, Crown, Gift, GraduationCap, Headphones,
  MessageCircle, PlayCircle, Radio, Route, Search, Star, TrendingUp, Video, Wallet, X,
} from '@/icons';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StudentCourseCard } from '../../components/student/StudentCourseCard';
import { DashboardBrowseCarousel } from '../../components/student/DashboardBrowseCarousel';
import { EmptyState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ReportChart } from '../../components/reports/ReportChart';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../store/AuthContext';
import {
  localizedCategoryName,
  localizedCourseTitle,
  localizedPathDescription,
  localizedPathTitle,
  localizedText,
} from '../../utils/localizedContent';
import { formatDateTime, formatRelativeTimeMinutes } from '../../utils/localeFormat';
import { formatMoney } from '../../utils/formatMoney';

const fmtDate = (value: string) => formatDateTime(value, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const fmtRelative = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diffMs / 60000);
  return formatRelativeTimeMinutes(mins);
};

export default function StudentDashboardPage() {
  const { t, i18n } = useTranslation('dashboard');
  const { t: tc } = useTranslation('common');
  const lang = i18n.language;
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [browseCategory, setBrowseCategory] = useState('');
  const [browseCourses, setBrowseCourses] = useState<any[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set());
  const [welcomeReferral, setWelcomeReferral] = useState<string | null>(() => {
    const state = location.state as { welcomeReferral?: boolean; referralCode?: string } | null;
    return state?.welcomeReferral && state?.referralCode ? state.referralCode : null;
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      studentApi.dashboard(),
      studentApi.courses({ sort: 'latest' }),
      studentApi.myCourses('all').catch(() => []),
    ]).then(([dashboardData, courses, myCourses]) => {
      setData(dashboardData);
      setBrowseCourses(courses);
      setEnrolledIds(new Set(myCourses.map((entry: any) => entry.courseId)));
    }).finally(() => setLoading(false));
  }, []);

  const loadBrowseCourses = async (categorySlug = '') => {
    setBrowseLoading(true);
    try {
      const params: Record<string, string> = { sort: 'latest' };
      if (categorySlug) params.category = categorySlug;
      const courses = await studentApi.courses(params);
      setBrowseCourses(courses);
    } finally {
      setBrowseLoading(false);
    }
  };

  const selectBrowseCategory = (slug: string) => {
    setBrowseCategory(slug);
    loadBrowseCourses(slug);
  };

  useEffect(() => {
    if ((location.state as { welcomeReferral?: boolean } | null)?.welcomeReferral) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    navigate(`/student/courses?${params.toString()}`);
  };

  const quickLinks = useMemo(() => [
    { label: t('student.quickLinks.myCourses'), path: '/student/my-courses', icon: PlayCircle },
    { label: t('student.quickLinks.courses'), path: '/student/courses', icon: BookOpen },
    { label: t('student.quickLinks.live'), path: '/student/live', icon: Radio },
    { label: t('student.quickLinks.certificates'), path: '/student/certificates', icon: Award },
    { label: t('student.quickLinks.support'), path: '/student/support', icon: Headphones },
  ], [t]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      { label: t('student.stats.inProgress'), value: data.activeCourses ?? 0 },
      { label: t('student.stats.completed'), value: data.completedCourses ?? 0 },
    ].filter((d) => d.value > 0);
  }, [data, t]);

  const unreadCount = useMemo(
    () => (data?.latestNotifications || []).filter((n: any) => !n.isRead).length,
    [data],
  );

  const completionRate = useMemo(() => {
    const total = data?.totalEnrolledCourses ?? 0;
    const done = data?.completedCourses ?? 0;
    return total ? Math.round((done / total) * 100) : 0;
  }, [data]);

  if (loading) return <DashboardSkeleton />;

  const firstName = user?.fullName?.split(' ')[0] || tc('header.greetingFallback');
  const continueCourse = data?.continueLearning;
  const referralCode = welcomeReferral || data?.rewardsSummary?.referralCode || user?.referralCode || '';

  const copyReferralCode = async (code: string) => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    showToast(t('student.referralCopied'), 'success');
  };

  return (
    <div className="page-grid student-dashboard">
      <div className="reports-header student-dashboard-header">
        <PageHeader
          title={t('student.title')}
          subtitle={t('student.subtitle', { name: user?.fullName || firstName })}
        />
        <div className="reports-header-actions">
          <Link to="/student/my-courses">
            <Button icon={<PlayCircle size={16} />}>{t('student.continueLearning')}</Button>
          </Link>
          <Link to="/student/courses">
            <Button variant="secondary">{t('student.browseCourses')}</Button>
          </Link>
        </div>
      </div>

      {welcomeReferral ? (
        <div className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success-container/50 p-4 text-on-success-container">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
            <Gift size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <strong className="block font-bold">{t('student.referral.welcomeTitle')}</strong>
            <span dir="ltr" className="mt-1 block text-lg font-extrabold tracking-widest">{welcomeReferral}</span>
            <span className="mt-0.5 block text-xs opacity-80">{t('student.referral.shareHint')}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" aria-label={t('student.referral.copyAria')} className="icon-btn" onClick={() => copyReferralCode(welcomeReferral)}>
              <Copy size={18} />
            </button>
            <button type="button" aria-label={tc('actions.close')} className="icon-btn" onClick={() => setWelcomeReferral(null)}>
              <X size={18} />
            </button>
          </div>
        </div>
      ) : null}

      <div className="stats-grid dashboard-stats student-dashboard-stats">
        <StatCard
          title={t('student.stats.myCourses')}
          value={String(data?.totalEnrolledCourses ?? 0)}
          icon={BookOpen}
          hint={t('student.stats.activeHint', { count: data?.activeCourses ?? 0 })}
        />
        <StatCard
          title={t('student.stats.completed')}
          value={String(data?.completedCourses ?? 0)}
          icon={GraduationCap}
          hint={t('student.stats.completionHint', { rate: completionRate })}
        />
        <StatCard title={t('student.stats.certificates')} value={String(data?.certificatesCount ?? 0)} icon={Award} />
        <StatCard
          title={t('student.stats.walletBalance')}
          value={formatMoney(data?.rewardsSummary?.walletBalance ?? 0)}
          icon={Wallet}
        />
      </div>

      <div className="student-dashboard-overview">
        <Card className="dashboard-search-card student-dashboard-search">
          <form className="home-search-bar" onSubmit={handleSearch}>
            <Search size={20} />
            <input
              type="search"
              placeholder={t('student.search.placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" size="sm">{tc('actions.search')}</Button>
          </form>
          <div className="category-chips">
            <button
              type="button"
              className={!browseCategory ? 'category-chip active' : 'category-chip'}
              onClick={() => selectBrowseCategory('')}
            >
              {tc('status.all')}
            </button>
            {(data?.categories || []).map((cat: any) => (
              <button
                key={cat.id}
                type="button"
                className={browseCategory === cat.slug ? 'category-chip active' : 'category-chip'}
                onClick={() => selectBrowseCategory(cat.slug)}
              >
                {localizedCategoryName(cat, lang)} ({cat._count?.courses || 0})
              </button>
            ))}
          </div>
          <div className="student-dashboard-browse">
            {browseLoading ? (
              <div className="student-dashboard-browse-row">
                <div className="student-dashboard-browse-carousel">
                  <div className="student-dashboard-browse-slide">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="skeleton skeleton-card student-dashboard-browse-skeleton" />
                    ))}
                  </div>
                </div>
              </div>
            ) : browseCourses.length ? (
              <DashboardBrowseCarousel
                courses={browseCourses}
                enrolledIds={enrolledIds}
                viewAllHref={browseCategory ? `/student/courses?category=${browseCategory}` : '/student/courses'}
                viewAllLabel={tc('actions.viewAll')}
                onCourseAction={(courseId, isEnrolled) => navigate(
                  isEnrolled ? `/student/player/${courseId}` : `/student/courses/${courseId}`,
                )}
              />
            ) : (
              <EmptyState
                title={t('student.search.emptyTitle')}
                description={t('student.search.emptyDesc')}
                icon={BookOpen}
                actionLabel={t('student.search.viewAll')}
                onAction={() => navigate('/student/courses')}
              />
            )}
          </div>
        </Card>

        {chartData.length ? (
          <Card className="student-dashboard-chart-card">
            <ReportChart title={t('student.search.chartTitle')} type="pie" data={chartData} height={168} />
          </Card>
        ) : null}
      </div>

      <div className="student-dashboard-quick-links">
        {quickLinks.map((link) => (
          <Link key={link.path} to={link.path} className="student-dashboard-quick-link">
            <link.icon size={20} />
            <span>{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="content-grid wide dashboard-panels">
        <Card variant="highlighted" className="dashboard-panel student-continue-panel">
          <h2><PlayCircle size={20} /> {t('student.continue.title')}</h2>
          <div className="dashboard-panel-body">
            {continueCourse ? (
              <div className="student-continue-block">
                <div className="student-continue-cover">
                  {continueCourse.course?.coverImage ? (
                    <img src={continueCourse.course.coverImage} alt="" />
                  ) : (
                    <BookOpen size={28} />
                  )}
                </div>
                <div className="student-continue-info">
                  <Badge variant="info">{localizedCategoryName(continueCourse.course?.category, lang) || t('student.continue.courseFallback')}</Badge>
                  <h3>{localizedCourseTitle(continueCourse.course, lang)}</h3>
                  <p>{continueCourse.course?.instructor?.fullName}</p>
                  <ProgressBar
                    value={Number(continueCourse.progressPercentage || 0)}
                    label={t('student.continue.progress')}
                    size="md"
                  />
                </div>
                <Link to={`/student/player/${continueCourse.courseId}`}>
                  <Button fullWidth icon={<PlayCircle size={18} />}>{t('student.continue.continueNow')}</Button>
                </Link>
              </div>
            ) : (
              <EmptyState
                title={t('student.continue.emptyTitle')}
                description={t('student.continue.emptyDesc')}
                actionLabel={t('student.browseCourses')}
                onAction={() => navigate('/student/courses')}
              />
            )}
          </div>
        </Card>

        <Card className="dashboard-panel dashboard-rewards">
          <h2><Gift size={20} /> {t('student.rewards.title')}</h2>
          <div className="dashboard-panel-body">
            <div className="rewards-wallet-highlight">
              <Star size={24} />
              <div>
                <span>{t('student.rewards.points')}</span>
                <strong>{data?.rewardsSummary?.rewardPoints ?? 0} {t('student.rewards.pointsUnit')}</strong>
              </div>
            </div>
            <div className="rewards-wallet-highlight">
              <Wallet size={24} />
              <div>
                <span>{t('student.rewards.wallet')}</span>
                <strong>{formatMoney(data?.rewardsSummary?.walletBalance ?? 0)}</strong>
              </div>
            </div>
            <button
              type="button"
              className="rewards-referral-box"
              onClick={() => copyReferralCode(referralCode)}
            >
              <span>{t('student.rewards.referralCopy')}</span>
              <div className="rewards-referral-row">
                <code>{referralCode || '—'}</code>
                <Copy size={18} />
              </div>
            </button>
            <div className="dashboard-panel-footer">
              <Link to="/student/rewards"><Button fullWidth variant="secondary" icon={<Gift size={16} />}>{t('student.rewards.viewRewards')}</Button></Link>
              <Link to="/student/profile"><Button fullWidth variant="ghost" icon={<Wallet size={16} />}>{t('student.rewards.viewProfile')}</Button></Link>
            </div>
          </div>
        </Card>
      </div>

      <div className="content-grid wide dashboard-panels">
        <Card className="dashboard-panel">
          <div className="dashboard-panel-title-row">
            <h2><Calendar size={20} /> {t('student.sessions.title')}</h2>
            {(data?.upcomingLiveSessions?.length ?? 0) > 0 ? (
              <Badge variant="info">{data.upcomingLiveSessions.length}</Badge>
            ) : null}
          </div>
          <div className="dashboard-panel-body">
            {(data?.upcomingLiveSessions || []).length ? (
              <div className="stack-sm">
                {data.upcomingLiveSessions.map((session: any) => (
                  <div key={session.id} className={`session-card student-dashboard-session ${session.status === 'LIVE' ? 'is-live' : ''}`}>
                    <div className="session-card-info">
                      <div className="chip-row">
                        <h4>{localizedText({ ar: session.titleAr, en: session.titleEn }, lang)}</h4>
                        {session.status === 'LIVE' ? (
                          <Badge variant="live">{t('student.sessions.liveNow')}</Badge>
                        ) : (
                          <Badge variant="info">{t('student.sessions.scheduled')}</Badge>
                        )}
                      </div>
                      <p>{localizedCourseTitle(session.course, lang)}</p>
                      <p><Calendar size={14} /> {fmtDate(session.startAt)}</p>
                    </div>
                    <Link to="/student/live">
                      <Button size="sm" variant="outline" icon={<Video size={14} />}>{t('student.sessions.join')}</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title={t('student.sessions.emptyTitle')} description={t('student.sessions.emptyDesc')} icon={Radio} />
            )}
            <div className="dashboard-panel-footer">
              <Link to="/student/live"><Button variant="ghost" size="sm">{t('student.sessions.viewAll')}</Button></Link>
            </div>
          </div>
        </Card>

        <Card className="dashboard-panel">
          <div className="dashboard-panel-title-row">
            <h2><Bell size={20} /> {t('student.notifications.title')}</h2>
            {unreadCount > 0 ? <Badge variant="warning">{t('student.notifications.newBadge', { count: unreadCount })}</Badge> : null}
          </div>
          <div className="dashboard-panel-body">
            {(data?.latestNotifications || []).length ? (
              <div className="student-dashboard-notifications">
                {data.latestNotifications.map((item: any) => (
                  <div key={item.id} className={`student-dashboard-notification ${item.isRead ? 'read' : 'unread'}`}>
                    <Bell size={16} />
                    <div>
                      <strong>{localizedText({ ar: item.titleAr, en: item.titleEn }, lang)}</strong>
                      <small>{fmtRelative(item.createdAt)}</small>
                    </div>
                    {!item.isRead ? <span className="notification-dot" aria-hidden /> : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title={t('student.notifications.emptyTitle')} description={t('student.notifications.emptyDesc')} icon={Bell} />
            )}
            <div className="dashboard-panel-footer">
              <Link to="/student/notifications"><Button variant="ghost" size="sm">{tc('actions.viewAll')}</Button></Link>
            </div>
          </div>
        </Card>
      </div>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2><Route size={20} /> {t('student.pathsSection.title')}</h2>
          <Link to="/student/learning-paths">{t('student.pathsSection.viewAll')}</Link>
        </div>
        <div className="learning-paths-grid dashboard-paths">
          {(data?.learningPaths || []).length ? (
            data.learningPaths.map((path: any) => (
              <Card key={path.id} className="learning-path-card student-learning-path-card">
                <div className="learning-path-top">
                  <span className="learning-path-icon"><Route size={22} /></span>
                  <span className="learning-path-count">{t('student.pathsSection.coursesCount', { count: path._count?.courses || path.courses?.length || 0 })}</span>
                </div>
                <h3>{localizedPathTitle(path, lang)}</h3>
                <p>{localizedPathDescription(path, lang, t('student.pathsSection.defaultDesc'))}</p>
                <Link to={`/student/learning-paths/${path.id}`} className="learning-path-action">
                  <Button size="sm" variant="outline" fullWidth>{t('student.pathsSection.explore')}</Button>
                </Link>
              </Card>
            ))
          ) : (
            <Card className="dashboard-empty-card">
              <EmptyState title={t('student.pathsSection.emptyTitle')} description={t('student.pathsSection.emptyDesc')} />
            </Card>
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2><TrendingUp size={20} /> {t('student.popular.title')}</h2>
          <Link to="/student/courses?sort=popular">{t('student.popular.viewAll')}</Link>
        </div>
        <div className="course-list-grid dashboard-courses">
          {(data?.popularCourses || []).length ? (
            data.popularCourses.map((course: any) => (
              <StudentCourseCard
                key={course.id}
                course={course}
                isEnrolled={false}
                onPrimaryAction={() => navigate(`/student/courses/${course.id}`)}
              />
            ))
          ) : (
            <Card className="dashboard-empty-card">
              <EmptyState title={t('student.popular.emptyTitle')} description={t('student.popular.emptyDesc')} />
            </Card>
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2><BookOpen size={20} /> {t('student.recommended.title')}</h2>
          <Link to="/student/courses">{t('student.recommended.viewAll')}</Link>
        </div>
        <div className="course-list-grid dashboard-courses">
          {(data?.recommendedCourses || []).length ? (
            data.recommendedCourses.map((course: any) => (
              <StudentCourseCard
                key={course.id}
                course={course}
                isEnrolled={false}
                onPrimaryAction={() => navigate(`/student/courses/${course.id}`)}
              />
            ))
          ) : (
            <Card className="dashboard-empty-card">
              <EmptyState title={t('student.recommended.emptyTitle')} description={t('student.recommended.emptyDesc')} icon={Crown} />
            </Card>
          )}
        </div>
      </section>

      <Card className="student-dashboard-community-cta">
        <MessageCircle size={24} />
        <div>
          <strong>{t('student.community.title')}</strong>
          <p>{t('student.community.desc')}</p>
        </div>
        <Link to="/student/community">
          <Button variant="secondary" size="sm">{t('student.community.cta')}</Button>
        </Link>
      </Card>
    </div>
  );
}
