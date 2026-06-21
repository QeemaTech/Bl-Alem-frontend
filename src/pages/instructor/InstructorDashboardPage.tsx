import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Clock, Play, Star, TrendingUp, UsersRound, Wallet } from 'lucide-react';
import { instructorApi } from '../../api/instructor';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';

export default function InstructorDashboardPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    instructorApi.dashboard().then(setData).finally(() => setLoading(false));
  }, []);

  const startSession = async (sessionId: number) => {
    try {
      await instructorApi.startLiveSession(sessionId);
      showToast('تم بدء الجلسة بنجاح', 'success');
      instructorApi.dashboard().then(setData);
    } catch {
      showToast('تعذر بدء الجلسة', 'error');
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (data?.approvalStatus === 'PENDING') {
    return (
      <div className="page-grid">
        <Card className="notice-card pending">
          <div>
            <Badge variant="pending">قيد المراجعة</Badge>
            <h2>حسابك قيد المراجعة</h2>
            <p>سيقوم المشرف العام بمراجعة حسابك. يمكنك إكمال ملفك الشخصي الآن، وسيتم تفعيل إدارة الكورسات بعد الموافقة.</p>
          </div>
          <Link to="/instructor/profile"><Button>إكمال الملف الشخصي</Button></Link>
        </Card>
        <Card>
          <EmptyState title="إدارة الكورسات غير مفعّلة" description="ستتوفر أزرار إضافة الكورسات بعد اعتماد حسابك." icon={Clock} />
        </Card>
      </div>
    );
  }

  if (data?.approvalStatus === 'REJECTED') {
    return (
      <div className="page-grid">
        <Card className="notice-card rejected">
          <div>
            <Badge variant="rejected">مرفوض</Badge>
            <h2>تم رفض طلب المحاضر</h2>
            <p>{data.rejectionReason || 'يرجى تحديث بياناتك وإعادة الإرسال للمراجعة.'}</p>
          </div>
          <Link to="/instructor/profile"><Button>تعديل الملف وإعادة الإرسال</Button></Link>
        </Card>
      </div>
    );
  }

  const growth = Number(data?.growthPercentage || 0);

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span>مرحباً أيها المحاضر</span>
          <h2>أدر دوراتك، طلابك، جلساتك وأرباحك من لوحة واحدة.</h2>
        </div>
        <Link to="/instructor/courses/create"><Button variant="secondary">إضافة كورس</Button></Link>
      </section>

      <Card className="growth-banner">
        <div>
          <p style={{ margin: '0 0 4px', color: 'var(--muted)', fontWeight: 700 }}>أنت على مسار رائع!</p>
          <strong>{growth >= 0 ? `+${growth}%` : `${growth}%`}</strong>
          <span style={{ color: 'var(--muted)', marginInlineStart: 8 }}>نمو الأرباح هذا الشهر</span>
        </div>
        <TrendingUp size={48} color="var(--primary)" />
      </Card>

      <div className="stats-grid">
        <StatCard title="أرباح الشهر" value={`${Number(data?.monthEarnings || 0)} ر.س`} icon={Wallet} />
        <StatCard title="الطلاب" value={String(data?.totalStudents || 0)} icon={UsersRound} />
        <StatCard title="المنشورة" value={String(data?.publishedCourses || 0)} icon={BookOpen} />
        <StatCard title="جلسات قادمة" value={String(data?.upcomingLiveSessions?.length || 0)} icon={Calendar} />
      </div>

      <Card>
        <h2>إجراءات سريعة</h2>
        <div className="chip-row">
          <Link to="/instructor/courses/create"><Button>إضافة كورس</Button></Link>
          <Link to="/instructor/courses"><Button variant="secondary">كورساتي</Button></Link>
          <Link to="/instructor/live"><Button variant="secondary">جلسة مباشرة</Button></Link>
          <Link to="/instructor/earnings"><Button variant="secondary">الأرباح</Button></Link>
        </div>
      </Card>

      <div className="content-grid wide">
        <Card>
          <h2>جلسات اليوم</h2>
          {data?.todayLiveSessions?.length ? (
            data.todayLiveSessions.map((s: any) => (
              <div key={s.id} className="session-card">
                <div className="session-card-info">
                  <h4>{s.titleAr}</h4>
                  <p>{s.course?.titleAr} — {new Date(s.startAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <Badge variant={s.status === 'LIVE' ? 'live' : 'pending'}>{s.status === 'LIVE' ? 'مباشر' : 'قادمة'}</Badge>
                <Button size="sm" onClick={() => startSession(s.id)} icon={<Play size={14} />}>بدء الجلسة</Button>
              </div>
            ))
          ) : (
            <EmptyState title="لا توجد جلسات اليوم" description="ستظهر جلساتك المجدولة لهذا اليوم هنا." />
          )}
        </Card>
        <Card>
          <h2>أفضل الكورسات مبيعاً</h2>
          {data?.bestSellingCourses?.length ? (
            data.bestSellingCourses.map((c: any) => (
              <div key={c.id} className="session-card">
                <div className="session-card-info">
                  <h4>{c.titleAr}</h4>
                  <p>{c.salesCount} عملية بيع — {c.enrollments} طالب</p>
                </div>
                <strong style={{ color: 'var(--primary-dark)' }}>{Number(c.revenue)} ر.س</strong>
              </div>
            ))
          ) : (
            <EmptyState title="لا توجد مبيعات" description="ستظهر أفضل الكورسات مبيعاً بعد أول عملية شراء." />
          )}
        </Card>
      </div>

      <Card>
        <h2>آخر التقييمات</h2>
        {data?.latestReviews?.length ? (
          data.latestReviews.map((r: any) => (
            <div key={r.id} className="notification-card">
              <span><Star size={16} fill="var(--warning)" color="var(--warning)" /> {r.user?.fullName}</span>
              <span>{r.rating}/5</span>
            </div>
          ))
        ) : (
          <EmptyState title="لا توجد تقييمات" description="ستظهر تقييمات الطلاب هنا." />
        )}
      </Card>
    </div>
  );
}
