import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CreditCard, Ticket, UsersRound } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { StatCard } from '../../components/ui/StatCard';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span>المشرف العام</span>
          <h2>تحكم كامل في منصة بالعِلم — الطلبات، الإيرادات، والدعم.</h2>
        </div>
        <Link to="/admin/courses"><Button variant="secondary">مراجعة الكورسات</Button></Link>
      </section>

      <div className="stats-grid">
        <StatCard title="المستخدمين" value={String(data.totalUsers)} icon={UsersRound} />
        <StatCard title="الطلاب" value={String(data.totalStudents)} icon={UsersRound} />
        <StatCard title="المحاضرين" value={String(data.totalInstructors)} icon={UsersRound} />
        <StatCard title="طلبات المحاضرين" value={String(data.pendingInstructors)} icon={Ticket} />
      </div>

      <div className="stats-grid">
        <StatCard title="الكورسات" value={String(data.totalCourses)} icon={BookOpen} />
        <StatCard title="قيد المراجعة" value={String(data.pendingCourses)} icon={BookOpen} />
        <StatCard title="الإيرادات" value={`${Number(data.totalRevenue)} ر.س`} icon={CreditCard} />
        <StatCard title="الاشتراكات" value={String(data.totalEnrollments)} icon={Ticket} />
      </div>

      <div className="content-grid wide">
        <Card>
          <h2>طلبات المحاضرين</h2>
          {data.latestInstructorRequests?.length ? (
            data.latestInstructorRequests.map((i: any) => (
              <div key={i.id} className="notification-card">
                <span>{i.user?.fullName}</span>
                <Badge variant={i.approvalStatus === 'PENDING' ? 'pending' : i.approvalStatus === 'APPROVED' ? 'success' : 'rejected'}>
                  {i.approvalStatus}
                </Badge>
              </div>
            ))
          ) : (
            <EmptyState title="لا توجد طلبات" description="لا توجد طلبات محاضرين جديدة." />
          )}
        </Card>
        <Card>
          <h2>طلبات مراجعة الكورسات</h2>
          {data.latestCourseRequests?.length ? (
            data.latestCourseRequests.map((c: any) => (
              <div key={c.id} className="session-card">
                <div className="session-card-info">
                  <h4>{c.titleAr}</h4>
                  <p>{c.instructor?.fullName}</p>
                </div>
                <Link to={`/admin/course-review/${c.id}`}><Button size="sm" variant="outline">مراجعة</Button></Link>
              </div>
            ))
          ) : (
            <EmptyState title="لا توجد كورسات" description="لا توجد كورسات قيد المراجعة." />
          )}
        </Card>
      </div>

      <div className="content-grid wide">
        <Card>
          <h2>آخر المدفوعات</h2>
          {data.latestPayments?.length ? (
            data.latestPayments.map((p: any) => (
              <div key={p.id} className="notification-card">
                <span>{p.user?.fullName}</span>
                <strong>{Number(p.finalAmount)} ر.س</strong>
              </div>
            ))
          ) : (
            <EmptyState title="لا توجد مدفوعات" />
          )}
        </Card>
        <Card>
          <h2>آخر تذاكر الدعم</h2>
          {data.latestSupportTickets?.length ? (
            data.latestSupportTickets.map((t: any) => (
              <div key={t.id} className="notification-card">
                <span>{t.subject}</span>
                <Badge variant={t.status === 'OPEN' ? 'warning' : 'success'}>{t.status}</Badge>
              </div>
            ))
          ) : (
            <EmptyState title="لا توجد تذاكر" />
          )}
        </Card>
      </div>

      <Card>
        <h2>إجراءات سريعة</h2>
        <div className="chip-row">
          <Link to="/admin/users"><Button>المستخدمون</Button></Link>
          <Link to="/admin/instructors"><Button variant="secondary">المحاضرون</Button></Link>
          <Link to="/admin/courses"><Button variant="secondary">الكورسات</Button></Link>
          <Link to="/admin/reports"><Button variant="secondary">التقارير</Button></Link>
        </div>
      </Card>
    </div>
  );
}
