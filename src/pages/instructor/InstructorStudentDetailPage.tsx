import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap, Mail, TrendingUp } from 'lucide-react';
import { instructorApi } from '../../api/instructor';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { enrollmentLabels, enrollmentVariant, fmtEnrollmentDate } from './instructorStudentShared';

function CountBadge({ value }: { value: string | number }) {
  return <span className="admin-count-badge" aria-label={`العدد: ${value}`}>{value}</span>;
}

export default function InstructorStudentDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const all = await instructorApi.students();
        const studentId = Number(userId);
        const matched = all.filter((row) => Number(row.user?.id) === studentId);
        if (!matched.length) {
          showToast('لم يتم العثور على الطالب.', 'error');
          navigate('/instructor/students');
          return;
        }
        setEnrollments(matched);
      } catch {
        showToast('تعذّر تحميل بيانات الطالب.', 'error');
        navigate('/instructor/students');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const student = enrollments[0]?.user;

  const stats = useMemo(() => {
    const active = enrollments.filter((e) => e.status === 'ACTIVE').length;
    const completed = enrollments.filter((e) => e.status === 'COMPLETED').length;
    const avgProgress = enrollments.length
      ? Math.round(
        enrollments.reduce((sum, e) => sum + Number(e.progressPercentage || 0), 0) / enrollments.length,
      )
      : 0;
    return {
      total: enrollments.length,
      active,
      completed,
      avgProgress,
    };
  }, [enrollments]);

  const progressChart = useMemo(() => (
    [...enrollments]
      .map((e) => ({
        label: e.course?.titleAr || '—',
        value: Number(e.progressPercentage || 0),
      }))
      .sort((a, b) => b.value - a.value)
  ), [enrollments]);

  const tableRows = useMemo(() => enrollments.map((row) => ({
    id: row.id,
    courseTitle: row.course?.titleAr || '—',
    enrolledAt: fmtEnrollmentDate(row.enrolledAt),
    progress: Number(row.progressPercentage || 0),
    status: enrollmentLabels[row.status] || row.status,
    _raw: row,
  })), [enrollments]);

  if (loading) {
    return (
      <div className="page-grid admin-list-page instructor-student-detail-page">
        <LoadingSkeleton variant="card" />
        <div className="stats-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="card" />
          ))}
        </div>
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  if (!student) return null;

  const name = String(student.fullName || '—');
  const email = String(student.email || '');

  return (
    <div className="page-grid admin-list-page instructor-student-detail-page admin-detail-page">
      <div className="admin-detail-top">
        <Link to="/instructor/students" className="admin-detail-back">
          <ArrowRight size={18} aria-hidden="true" />
          العودة لقائمة الطلاب
        </Link>
      </div>

      <Card className="admin-user-hero instructor-student-hero">
        <div className="admin-user-hero-body">
          <div className="admin-user-hero-main">
            <div className="admin-user-hero-avatar" aria-hidden="true">
              {student.avatar
                ? <img src={student.avatar} alt="" />
                : <span>{name.slice(0, 1)}</span>}
            </div>
            <div className="admin-user-hero-copy">
              <div className="admin-user-hero-title-row">
                <h1>{name}</h1>
                <Badge variant="default">طالب</Badge>
              </div>
              <div className="admin-user-hero-meta">
                {email ? (
                  <span dir="ltr">
                    <Mail size={14} aria-hidden="true" />
                    {email}
                  </span>
                ) : null}
                <span>
                  <BookOpen size={14} aria-hidden="true" />
                  {stats.total} اشتراك في كورساتك
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="admin-list-stats stats-grid instructor-students-stats">
        <StatCard title="إجمالي الاشتراكات" value={String(stats.total)} icon={BookOpen} />
        <StatCard title="نشط" value={String(stats.active)} icon={TrendingUp} />
        <StatCard title="مكتمل" value={String(stats.completed)} icon={GraduationCap} />
        <StatCard title="متوسط التقدم" value={`${stats.avgProgress}%`} icon={TrendingUp} />
      </div>

      {progressChart.length ? (
        <div className="admin-list-charts reports-charts-grid instructor-students-chart">
          <ReportChart
            title="التقدم حسب الكورس"
            type="bar"
            data={progressChart}
            barGradient
            showBarValueLabels
            barDomain={[0, 100]}
            hideTotal
          />
        </div>
      ) : null}

      <Card className="admin-table-card instructor-students-table-card">
        <div className="section-heading instructor-students-table-head">
          <h2>كورسات الطالب</h2>
          <CountBadge value={enrollments.length} />
        </div>
        <Table
          className="instructor-students-table"
          data={tableRows}
          hideScrollNotice
          emptyTitle="لا توجد اشتراكات"
          columns={[
            {
              key: 'courseTitle',
              header: 'الكورس',
              wrap: true,
            },
            {
              key: 'enrolledAt',
              header: 'تاريخ الاشتراك',
              align: 'center',
              hideOnMobile: true,
            },
            {
              key: 'progress',
              header: 'التقدم',
              align: 'center',
              render: (row) => (
                <div className="student-progress-cell">
                  <span className="instructor-progress-value">{row.progress}%</span>
                  <ProgressBar value={row.progress} />
                </div>
              ),
            },
            {
              key: 'status',
              header: 'الحالة',
              align: 'center',
              render: (row) => (
                <Badge variant={enrollmentVariant(String(row._raw.status))}>
                  {row.status}
                </Badge>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
