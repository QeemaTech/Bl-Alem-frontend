import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Download, GraduationCap, TrendingUp, Users } from '@/icons';
import { instructorApi } from '../../api/instructor';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { TableEntityLink } from '../../components/ui/TableEntityLink';
import { exportTableToExcel } from '../../utils/exportExcel';
import { enrollmentLabels, enrollmentVariant, fmtEnrollmentDate } from './instructorStudentShared';

const exportColumns = [
  { key: 'student', header: 'الطالب' },
  { key: 'email', header: 'البريد' },
  { key: 'course', header: 'الكورس' },
  { key: 'enrolledAt', header: 'تاريخ الاشتراك' },
  { key: 'progress', header: 'التقدم %' },
  { key: 'status', header: 'الحالة' },
];

const UNIQUE_STUDENTS_TOOLTIP = 'عدد الطلاب المميزين — كل طالب يُحسب مرة واحدة حتى لو اشترك في أكثر من كورس.';
const TOTAL_ENROLLMENTS_TOOLTIP = 'إجمالي الاشتراكات — كل اشتراك في كورس يُحسب كسجل منفصل، لذا قد يتجاوز عدد الطلاب الفريدين.';

function CountBadge({ value }: { value: string | number }) {
  return <span className="admin-count-badge" aria-label={`العدد: ${value}`}>{value}</span>;
}

export default function InstructorStudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = async (id = courseId) => {
    setLoading(true);
    setStudents(await instructorApi.students(id || undefined));
    setLoading(false);
  };

  useEffect(() => {
    instructorApi.courses({ status: 'all' }).then(setCourses);
    load('');
  }, []);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (statusFilter) result = result.filter((s) => s.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((s) =>
        [s.user?.fullName, s.user?.email, s.course?.titleAr, enrollmentLabels[s.status]]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [students, statusFilter, search]);

  const stats = useMemo(() => {
    const uniqueStudents = new Set(students.map((s) => s.user?.id)).size;
    const active = students.filter((s) => s.status === 'ACTIVE').length;
    const completed = students.filter((s) => s.status === 'COMPLETED').length;
    const avgProgress = students.length
      ? Math.round(students.reduce((sum, s) => sum + Number(s.progressPercentage || 0), 0) / students.length)
      : 0;
    return { total: students.length, uniqueStudents, active, completed, avgProgress };
  }, [students]);

  const courseChart = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s) => {
      const title = s.course?.titleAr || '—';
      map.set(title, (map.get(title) || 0) + 1);
    });
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [students]);

  const tableRows = useMemo(() => filteredStudents.map((row) => ({
    ...row,
    id: row.id,
  })), [filteredStudents]);

  const handleExport = () => {
    exportTableToExcel('طلاب-المحاضر', exportColumns, filteredStudents.map((row) => ({
      student: row.user?.fullName || '—',
      email: row.user?.email || '—',
      course: row.course?.titleAr || '—',
      enrolledAt: fmtEnrollmentDate(row.enrolledAt),
      progress: Number(row.progressPercentage || 0),
      status: enrollmentLabels[row.status] || row.status,
    })));
  };

  const handleCourseChange = (value: string) => {
    setCourseId(value);
    load(value);
  };

  const goToStudent = (userId: number | string) => navigate(`/instructor/students/${userId}`);

  return (
    <div className="page-grid admin-list-page instructor-students-page">
      <div className="admin-list-header">
        <PageHeader
          title="طلابي"
          subtitle="تابع تقدم الطلاب المشتركين في كورساتك"
        />
        <div className="admin-list-header-actions">
          <Button
            variant="outline"
            icon={<Download size={18} aria-hidden="true" />}
            onClick={handleExport}
            disabled={!filteredStudents.length}
          >
            تصدير Excel
          </Button>
        </div>
      </div>

      <div className="admin-list-stats stats-grid instructor-students-stats">
        <StatCard
          title="إجمالي الاشتراكات"
          value={String(stats.total)}
          icon={BookOpen}
          tooltip={TOTAL_ENROLLMENTS_TOOLTIP}
        />
        <StatCard
          title="طلاب فريدون"
          value={String(stats.uniqueStudents)}
          icon={Users}
          tooltip={UNIQUE_STUDENTS_TOOLTIP}
        />
        <StatCard title="نشط" value={String(stats.active)} icon={TrendingUp} />
        <StatCard
          title="مكتمل"
          value={String(stats.completed)}
          icon={GraduationCap}
          hint={`متوسط التقدم ${stats.avgProgress}%`}
        />
      </div>

      {courseChart.length ? (
        <div className="admin-list-charts reports-charts-grid instructor-students-chart">
          <ReportChart
            title="الاشتراكات حسب الكورس"
            type="bar"
            data={courseChart}
            barGradient
            showBarValueLabels
          />
        </div>
      ) : null}

      <FilterBar
        className="filter-bar--modern instructor-students-filters"
        searchValue={search}
        searchPlaceholder="بحث بالطالب، البريد، أو الكورس..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); handleCourseChange(''); }}
        searchIconSize={20}
      >
        <Select
          label="الكورس"
          value={courseId}
          onChange={(e) => handleCourseChange(e.target.value)}
          options={[
            { label: 'كل الكورسات', value: '' },
            ...courses.map((c) => ({ label: c.titleAr, value: String(c.id) })),
          ]}
        />
        <Select
          label="حالة الاشتراك"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'نشط', value: 'ACTIVE' },
            { label: 'مكتمل', value: 'COMPLETED' },
            { label: 'ملغي', value: 'CANCELLED' },
          ]}
        />
      </FilterBar>

      <Card className="admin-table-card instructor-students-table-card">
        <div className="section-heading instructor-students-table-head">
          <h2>قائمة الطلاب</h2>
          <CountBadge value={filteredStudents.length} />
        </div>
        {loading ? (
          <div className="instructor-students-loading">
            <LoadingSkeleton variant="row" count={5} />
          </div>
        ) : filteredStudents.length ? (
          <Table
            className="instructor-students-table"
            loading={false}
            data={tableRows}
            hideScrollNotice
            onRowClick={(row) => goToStudent((row.user as any)?.id)}
            emptyTitle="لا يوجد طلاب"
            columns={[
              {
                key: 'user',
                header: 'الطالب',
                render: (row) => {
                  const name = String((row.user as any)?.fullName || '—');
                  const email = String((row.user as any)?.email || '');
                  const id = (row.user as any)?.id;
                  return (
                    <div className="student-cell">
                      <span className="student-cell-avatar" aria-hidden="true">{name.slice(0, 1)}</span>
                      <div>
                        {id ? (
                          <TableEntityLink to={`/instructor/students/${id}`}>
                            {name}
                          </TableEntityLink>
                        ) : (
                          <strong>{name}</strong>
                        )}
                        {email ? (
                          <small dir="ltr" className="admin-cell-email">{email}</small>
                        ) : null}
                      </div>
                    </div>
                  );
                },
              },
              {
                key: 'course',
                header: 'الكورس',
                wrap: true,
                render: (row) => String((row.course as any)?.titleAr || '—'),
              },
              {
                key: 'enrolledAt',
                header: 'تاريخ الاشتراك',
                align: 'center',
                hideOnMobile: true,
                render: (row) => fmtEnrollmentDate(String(row.enrolledAt)),
              },
              {
                key: 'progressPercentage',
                header: 'التقدم',
                align: 'center',
                render: (row) => {
                  const progress = Number(row.progressPercentage || 0);
                  return (
                    <div className="student-progress-cell">
                      <span className="instructor-progress-value">{progress}%</span>
                      <ProgressBar value={progress} />
                    </div>
                  );
                },
              },
              {
                key: 'status',
                header: 'الحالة',
                align: 'center',
                render: (row) => (
                  <Badge variant={enrollmentVariant(String(row.status))}>
                    {enrollmentLabels[String(row.status)] || String(row.status)}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'الإجراءات',
                minWidth: 100,
                render: (row) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToStudent((row.user as any)?.id);
                    }}
                  >
                    التفاصيل
                  </Button>
                ),
              },
            ]}
          />
        ) : students.length ? (
          <div className="instructor-students-empty">
            <EmptyState title="لا نتائج" description="جرّب تغيير الفلاتر أو البحث." icon={Users} />
          </div>
        ) : (
          <div className="instructor-students-empty">
            <EmptyState title="لا يوجد طلاب" description="سيظهر الطلاب بعد الاشتراك في كورساتك." icon={Users} />
          </div>
        )}
      </Card>
    </div>
  );
}
