import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award, Bell, BookOpen, Calendar, Copy, Crown, Gift, GraduationCap, Headphones,
  MessageCircle, PlayCircle, Radio, Route, Search, Sparkles, TrendingUp, Video, Wallet,
} from '@/icons';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CourseCard } from '../../components/ui/CourseCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ReportChart } from '../../components/reports/ReportChart';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../store/AuthContext';
import { formatMoney } from '../../utils/formatMoney';

const fmtDate = (value: string) => new Date(value).toLocaleDateString('ar-SA', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const fmtRelative = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  return fmtDate(value);
};

const quickLinks = [
  { label: 'كورساتي', path: '/student/my-courses', icon: PlayCircle },
  { label: 'الكورسات', path: '/student/courses', icon: BookOpen },
  { label: 'الجلسات المباشرة', path: '/student/live', icon: Radio },
  { label: 'الشهادات', path: '/student/certificates', icon: Award },
  { label: 'المحفظة', path: '/student/wallet', icon: Wallet },
  { label: 'الدعم', path: '/student/support', icon: Headphones },
];

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    studentApi.dashboard().then(setData).finally(() => setLoading(false));
  }, []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    navigate(`/student/courses?${params.toString()}`);
  };

  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'قيد التعلم', value: data.activeCourses ?? 0 },
      { label: 'مكتملة', value: data.completedCourses ?? 0 },
    ].filter((d) => d.value > 0);
  }, [data]);

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

  const firstName = user?.fullName?.split(' ')[0] || 'بك';
  const continueCourse = data?.continueLearning;

  return (
    <div className="page-grid student-dashboard">
      <PageHeader
        title="لوحة الطالب"
        subtitle={`مرحباً ${user?.fullName || firstName}، تابع يومك التعليمي من هنا`}
      />

      <section className="hero-card dashboard-hero student-dashboard-hero">
        <div className="student-dashboard-hero-text">
          <span><Sparkles size={14} /> مرحباً {firstName}</span>
          <h2>تابع تعلمك، جلساتك، ومكافآتك من لوحة واحدة.</h2>
          <p>كل المحتوى هنا داخلي بعد تسجيل الدخول — ابدأ من حيث توقفت.</p>
        </div>
        <div className="dashboard-hero-actions">
          <Link to="/student/my-courses">
            <Button icon={<PlayCircle size={16} />}>استكمال التعلم</Button>
          </Link>
          <Link to="/student/courses">
            <Button variant="secondary">تصفح الكورسات</Button>
          </Link>
        </div>
      </section>

      <div className="stats-grid dashboard-stats">
        <StatCard
          title="كورساتي"
          value={String(data?.totalEnrolledCourses ?? 0)}
          icon={BookOpen}
          hint={`${data?.activeCourses ?? 0} نشطة`}
        />
        <StatCard title="مكتملة" value={String(data?.completedCourses ?? 0)} icon={GraduationCap} hint={`${completionRate}% إنجاز`} />
        <StatCard title="شهاداتي" value={String(data?.certificatesCount ?? 0)} icon={Award} />
        <StatCard
          title="رصيد المحفظة"
          value={formatMoney(data?.rewardsSummary?.walletBalance ?? 0)}
          icon={Wallet}
        />
      </div>

      <div className="student-dashboard-overview">
        {chartData.length ? (
          <Card className="student-dashboard-chart-card">
            <ReportChart title="حالة التعلم" type="pie" data={chartData} height={220} />
          </Card>
        ) : null}

        <Card className="dashboard-search-card student-dashboard-search">
          <form className="home-search-bar" onSubmit={handleSearch}>
            <Search size={20} />
            <input
              type="search"
              placeholder="ابحث عن دورة أو مهارة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" size="sm">بحث</Button>
          </form>
          <div className="category-chips">
            <button type="button" className="category-chip active" onClick={() => navigate('/student/courses')}>
              الكل
            </button>
            {(data?.categories || []).map((cat: any) => (
              <button
                key={cat.id}
                type="button"
                className="category-chip"
                onClick={() => navigate(`/student/courses?category=${cat.slug}`)}
              >
                {cat.nameAr} ({cat._count?.courses || 0})
              </button>
            ))}
          </div>
        </Card>
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
          <h2><PlayCircle size={20} /> استكمال التعلم</h2>
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
                  <Badge variant="info">{continueCourse.course?.category?.nameAr || 'دورة'}</Badge>
                  <h3>{continueCourse.course?.titleAr}</h3>
                  <p>{continueCourse.course?.instructor?.fullName}</p>
                  <ProgressBar
                    value={Number(continueCourse.progressPercentage || 0)}
                    label="التقدم"
                    size="md"
                  />
                </div>
                <Link to={`/student/player/${continueCourse.courseId}`}>
                  <Button fullWidth icon={<PlayCircle size={18} />}>استكمال الآن</Button>
                </Link>
              </div>
            ) : (
              <EmptyState
                title="لا توجد دورة قيد التعلم"
                description="ابدأ بالاشتراك في دورة من صفحة الكورسات المتاحة."
                actionLabel="تصفح الكورسات"
                onAction={() => navigate('/student/courses')}
              />
            )}
          </div>
        </Card>

        <Card className="dashboard-panel dashboard-rewards">
          <h2><Gift size={20} /> المكافآت والمحفظة</h2>
          <div className="dashboard-panel-body">
            <div className="rewards-wallet-highlight">
              <Wallet size={24} />
              <div>
                <span>رصيد المحفظة</span>
                <strong>{formatMoney(data?.rewardsSummary?.walletBalance ?? 0)}</strong>
              </div>
            </div>
            <button
              type="button"
              className="rewards-referral-box"
              onClick={async () => {
                const code = data?.rewardsSummary?.referralCode || '';
                if (!code) return;
                await navigator.clipboard.writeText(code);
                showToast('تم نسخ كود الإحالة', 'success');
              }}
            >
              <span>كود الإحالة — انسخ وشارك</span>
              <div className="rewards-referral-row">
                <code>{data?.rewardsSummary?.referralCode || '—'}</code>
                <Copy size={16} />
              </div>
            </button>
            <div className="dashboard-panel-footer">
              <Link to="/student/wallet"><Button fullWidth variant="secondary" icon={<Wallet size={16} />}>المحفظة</Button></Link>
              <Link to="/student/rewards"><Button fullWidth variant="ghost" icon={<Gift size={16} />}>المكافآت والإحالات</Button></Link>
            </div>
          </div>
        </Card>
      </div>

      <div className="content-grid wide dashboard-panels">
        <Card className="dashboard-panel">
          <div className="dashboard-panel-title-row">
            <h2><Calendar size={20} /> الجلسات القادمة</h2>
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
                        <h4>{session.titleAr}</h4>
                        {session.status === 'LIVE' ? (
                          <Badge variant="live">مباشر الآن</Badge>
                        ) : (
                          <Badge variant="info">مجدولة</Badge>
                        )}
                      </div>
                      <p>{session.course?.titleAr}</p>
                      <p><Calendar size={14} /> {fmtDate(session.startAt)}</p>
                    </div>
                    <Link to="/student/live">
                      <Button size="sm" variant="outline" icon={<Video size={14} />}>انضمام</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="لا توجد جلسات" description="لا توجد جلسات مباشرة قادمة حالياً." icon={Radio} />
            )}
            <div className="dashboard-panel-footer">
              <Link to="/student/live"><Button variant="ghost" size="sm">عرض كل الجلسات</Button></Link>
            </div>
          </div>
        </Card>

        <Card className="dashboard-panel">
          <div className="dashboard-panel-title-row">
            <h2><Bell size={20} /> آخر الإشعارات</h2>
            {unreadCount > 0 ? <Badge variant="warning">{unreadCount} جديد</Badge> : null}
          </div>
          <div className="dashboard-panel-body">
            {(data?.latestNotifications || []).length ? (
              <div className="student-dashboard-notifications">
                {data.latestNotifications.map((item: any) => (
                  <div key={item.id} className={`student-dashboard-notification ${item.isRead ? 'read' : 'unread'}`}>
                    <Bell size={16} />
                    <div>
                      <strong>{item.titleAr}</strong>
                      <small>{fmtRelative(item.createdAt)}</small>
                    </div>
                    {!item.isRead ? <span className="notification-dot" aria-hidden /> : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="لا توجد إشعارات" description="ستظهر تحديثاتك التعليمية هنا." icon={Bell} />
            )}
            <div className="dashboard-panel-footer">
              <Link to="/student/notifications"><Button variant="ghost" size="sm">عرض الكل</Button></Link>
            </div>
          </div>
        </Card>
      </div>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2><Route size={20} /> مسارات تعليمية</h2>
          <Link to="/student/learning-paths">عرض الكل</Link>
        </div>
        <div className="learning-paths-grid dashboard-paths">
          {(data?.learningPaths || []).length ? (
            data.learningPaths.map((path: any) => (
              <Card key={path.id} className="learning-path-card student-learning-path-card">
                <div className="learning-path-top">
                  <span className="learning-path-icon"><Route size={22} /></span>
                  <span className="learning-path-count">{path._count?.courses || path.courses?.length || 0} دورات</span>
                </div>
                <h3>{path.titleAr}</h3>
                <p>{path.descriptionAr || 'مسار تعليمي منظم'}</p>
                <Link to={`/student/learning-paths/${path.id}`} className="learning-path-action">
                  <Button size="sm" variant="outline" fullWidth>استكشف المسار</Button>
                </Link>
              </Card>
            ))
          ) : (
            <Card className="dashboard-empty-card">
              <EmptyState title="لا توجد مسارات" description="ستُضاف مسارات تعليمية قريباً." />
            </Card>
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2><TrendingUp size={20} /> الأكثر شعبية</h2>
          <Link to="/student/courses?sort=popular">عرض الكل</Link>
        </div>
        <div className="course-list-grid dashboard-courses">
          {(data?.popularCourses || []).length ? (
            data.popularCourses.map((course: any) => (
              <CourseCard
                key={course.id}
                title={course.titleAr}
                category={course.category?.nameAr || 'دورة'}
                instructor={course.instructor?.fullName}
                imageUrl={course.coverImage}
                price={Number(course.discountPrice ?? course.price)}
                rating={Number(course.ratingAverage || 0)}
                duration={`${course._count?.lessons || 0} دروس`}
                actionLabel="عرض التفاصيل"
                onAction={() => navigate(`/student/courses/${course.id}`)}
              />
            ))
          ) : (
            <Card className="dashboard-empty-card">
              <EmptyState title="لا توجد دورات شائعة" description="ستظهر الدورات الأكثر اشتراكاً هنا." />
            </Card>
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2><BookOpen size={20} /> دورات مقترحة لك</h2>
          <Link to="/student/courses">عرض الكل</Link>
        </div>
        <div className="course-list-grid dashboard-courses">
          {(data?.recommendedCourses || []).length ? (
            data.recommendedCourses.map((course: any) => (
              <CourseCard
                key={course.id}
                title={course.titleAr}
                category={course.category?.nameAr || 'دورة'}
                instructor={course.instructor?.fullName}
                imageUrl={course.coverImage}
                price={Number(course.discountPrice ?? course.price)}
                rating={Number(course.ratingAverage || 0)}
                duration={`${course._count?.lessons || 0} دروس`}
                actionLabel="عرض التفاصيل"
                onAction={() => navigate(`/student/courses/${course.id}`)}
              />
            ))
          ) : (
            <Card className="dashboard-empty-card">
              <EmptyState title="لا توجد توصيات حالياً" description="ستظهر الدورات المقترحة هنا بعد توفرها." icon={Crown} />
            </Card>
          )}
        </div>
      </section>

      <Card className="student-dashboard-community-cta">
        <MessageCircle size={24} />
        <div>
          <strong>انضم للمجتمع</strong>
          <p>شارك أسئلتك وتجاربك مع المتعلمين الآخرين.</p>
        </div>
        <Link to="/student/community">
          <Button variant="secondary" size="sm">زيارة المجتمع</Button>
        </Link>
      </Card>
    </div>
  );
}
