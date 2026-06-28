import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap, Mail, NavChevronBack, TrendingUp } from '@/icons';
import { instructorApi } from '../../api/instructor';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { localizedCourseTitle } from '../../utils/localizedContent';
import { getEnrollmentLabel, enrollmentVariant, fmtEnrollmentDate } from './instructorStudentShared';

function CountBadge({ value, ariaLabel }: { value: string | number; ariaLabel: string }) {
  return <span className="admin-count-badge" aria-label={ariaLabel}>{value}</span>;
}

export default function InstructorStudentDetailPage() {
  const { t, i18n } = useTranslation('dashboard');
  const lang = i18n.language;
  const isLtr = lang.startsWith('en');
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
          showToast(t('instructor.students.detail.toast.notFound'), 'error');
          navigate('/instructor/students');
          return;
        }
        setEnrollments(matched);
      } catch {
        showToast(t('instructor.students.detail.toast.loadFailed'), 'error');
        navigate('/instructor/students');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, navigate, showToast, t]);

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
        label: localizedCourseTitle(e.course, lang),
        value: Number(e.progressPercentage || 0),
      }))
      .sort((a, b) => b.value - a.value)
  ), [enrollments, lang]);

  const tableRows = useMemo(() => enrollments.map((row) => ({
    id: row.id,
    courseTitle: localizedCourseTitle(row.course, lang),
    enrolledAt: fmtEnrollmentDate(row.enrolledAt, lang),
    progress: Number(row.progressPercentage || 0),
    status: getEnrollmentLabel(row.status),
    _raw: row,
  })), [enrollments, lang]);

  const tableColumns = useMemo(() => {
    const cols = t('instructor.students.table.columns', { returnObjects: true }) as Record<string, string>;
    return [
      {
        key: 'courseTitle',
        header: cols.course,
        wrap: true,
      },
      {
        key: 'enrolledAt',
        header: cols.enrolledAt,
        align: 'center' as const,
        hideOnMobile: true,
      },
      {
        key: 'progress',
        header: cols.progress,
        align: 'center' as const,
        render: (row: typeof tableRows[number]) => (
          <div className="student-progress-cell">
            <span className="instructor-progress-value">{row.progress}%</span>
            <ProgressBar value={row.progress} />
          </div>
        ),
      },
      {
        key: 'status',
        header: cols.status,
        align: 'center' as const,
        render: (row: typeof tableRows[number]) => (
          <Badge variant={enrollmentVariant(String(row._raw.status))}>
            {row.status}
          </Badge>
        ),
      },
    ];
  }, [t, lang]);

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
  const BackIcon = isLtr ? NavChevronBack : ArrowRight;

  return (
    <div className="page-grid admin-list-page instructor-student-detail-page admin-detail-page">
      <div className="admin-detail-top">
        <Link to="/instructor/students" className="admin-detail-back">
          <BackIcon size={18} aria-hidden="true" />
          {t('instructor.students.detail.backToList')}
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
                <Badge variant="default">{t('instructor.students.detail.badgeStudent')}</Badge>
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
                  {t('instructor.students.detail.enrollmentsCount', { count: stats.total })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="admin-list-stats stats-grid instructor-students-stats">
        <StatCard title={t('instructor.students.detail.stats.totalEnrollments')} value={String(stats.total)} icon={BookOpen} />
        <StatCard title={t('instructor.students.detail.stats.active')} value={String(stats.active)} icon={TrendingUp} />
        <StatCard title={t('instructor.students.detail.stats.completed')} value={String(stats.completed)} icon={GraduationCap} />
        <StatCard title={t('instructor.students.detail.stats.avgProgress')} value={`${stats.avgProgress}%`} icon={TrendingUp} />
      </div>

      {progressChart.length ? (
        <div className="admin-list-charts reports-charts-grid instructor-students-chart">
          <ReportChart
            title={t('instructor.students.detail.chart.title')}
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
          <h2>{t('instructor.students.detail.table.title')}</h2>
          <CountBadge
            value={enrollments.length}
            ariaLabel={t('instructor.students.detail.countAria', { value: enrollments.length })}
          />
        </div>
        <Table
          className="instructor-students-table"
          data={tableRows}
          hideScrollNotice
          emptyTitle={t('instructor.students.detail.table.emptyTitle')}
          columns={tableColumns}
        />
      </Card>
    </div>
  );
}
