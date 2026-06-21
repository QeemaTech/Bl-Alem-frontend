import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Download, GraduationCap, TrendingUp, Users } from 'lucide-react';
import { instructorApi } from '../../api/instructor';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { exportTableToExcel } from '../../utils/exportExcel';

const enrollmentLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
  PENDING: 'معلق',
};

const enrollmentVariant = (status: string) => {
  if (status === 'COMPLETED') return 'success' as const;
  if (status === 'ACTIVE') return 'info' as const;
  if (status === 'CANCELLED') return 'rejected' as const;
  return 'default' as const;
};

const fmtDate = (value?: string) => (value
  ? new Date(value).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
  : '—');

const exportColumns = [
  { key: 'student', header: 'الطالب' },
  { key: 'email', header: 'البريد' },
  { key: 'course', header: 'الكورس' },
  { key: 'enrolledAt', header: 'تاريخ الاشتراك' },
  { key: 'progress', header: 'التقدم %' },
  { key: 'status', header: 'الحالة' },
];

export default function InstructorStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

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

  const handleExport = () => {
    exportTableToExcel('طلاب-المحاضر', exportColumns, filteredStudents.map((row) => ({
      student: row.user?.fullName || '—',
      email: row.user?.email || '—',
      course: row.course?.titleAr || '—',
      enrolledAt: fmtDate(row.enrolledAt),
      progress: Number(row.progressPercentage || 0),
      status: enrollmentLabels[row.status] || row.status,
    })));
  };

  const handleCourseChange = (value: string) => {
    setCourseId(value);
    load(value);
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title="طلابي"
          subtitle="تابع تقدم الطلاب المشتركين في كورساتك"
        />
        <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!filteredStudents.length}>
          تصدير Excel
        </Button>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي الاشتراكات" value={String(stats.total)} icon={BookOpen} />
        <StatCard title="طلاب فريدون" value={String(stats.uniqueStudents)} icon={Users} />
        <StatCard title="نشط" value={String(stats.active)} icon={TrendingUp} />
        <StatCard title="مكتمل" value={String(stats.completed)} icon={GraduationCap} hint={`متوسط التقدم ${stats.avgProgress}%`} />
      </div>

      {courseChart.length ? (
        <div className="reports-charts-grid">
          <ReportChart title="الاشتراكات حسب الكورس" type="bar" data={courseChart} />
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالطالب، البريد، أو الكورس..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); handleCourseChange(''); }}
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

      <Card>
        <div className="section-heading">
          <h2>قائمة الطلاب</h2>
          <span className="muted-count">{filteredStudents.length} اشتراك</span>
        </div>
        {loading ? (
          <LoadingSkeleton variant="row" count={5} />
        ) : filteredStudents.length ? (
          <Table
            data={filteredStudents}
            emptyTitle="لا يوجد طلاب"
            columns={[
              {
                key: 'user',
                header: 'الطالب',
                render: (row) => {
                  const name = String((row.user as any)?.fullName || '—');
                  return (
                    <div className="student-cell">
                      <span className="student-cell-avatar">{name.slice(0, 1)}</span>
                      <div>
                        <strong>{name}</strong>
                        <small>{(row.user as any)?.email || ''}</small>
                      </div>
                    </div>
                  );
                },
              },
              {
                key: 'course',
                header: 'الكورس',
                render: (row) => String((row.course as any)?.titleAr || '—'),
              },
              {
                key: 'enrolledAt',
                header: 'تاريخ الاشتراك',
                render: (row) => fmtDate(String(row.enrolledAt)),
              },
              {
                key: 'progressPercentage',
                header: 'التقدم',
                render: (row) => {
                  const progress = Number(row.progressPercentage || 0);
                  return (
                    <div className="student-progress-cell">
                      <ProgressBar value={progress} label="التقدم" />
                    </div>
                  );
                },
              },
              {
                key: 'status',
                header: 'الحالة',
                render: (row) => (
                  <Badge variant={enrollmentVariant(String(row.status))}>
                    {enrollmentLabels[String(row.status)] || String(row.status)}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'الإجراءات',
                render: (row) => (
                  <Button variant="ghost" size="sm" onClick={() => setSelected(row)}>
                    التفاصيل
                  </Button>
                ),
              },
            ]}
          />
        ) : students.length ? (
          <EmptyState title="لا نتائج" description="جرّب تغيير الفلاتر أو البحث." icon={Users} />
        ) : (
          <EmptyState title="لا يوجد طلاب" description="سيظهر الطلاب بعد الاشتراك في كورساتك." icon={Users} />
        )}
      </Card>

      <Modal isOpen={Boolean(selected)} title="تفاصيل الاشتراك" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>الطالب</span><strong>{selected.user?.fullName || '—'}</strong></div>
            <div className="detail-row"><span>البريد</span><strong dir="ltr">{selected.user?.email || '—'}</strong></div>
            <div className="detail-row"><span>الكورس</span><strong>{selected.course?.titleAr || '—'}</strong></div>
            <div className="detail-row"><span>تاريخ الاشتراك</span><strong>{fmtDate(selected.enrolledAt)}</strong></div>
            <div className="detail-row">
              <span>التقدم</span>
              <strong>{Number(selected.progressPercentage || 0)}%</strong>
            </div>
            <div className="detail-row">
              <span>الحالة</span>
              <Badge variant={enrollmentVariant(selected.status)}>
                {enrollmentLabels[selected.status] || selected.status}
              </Badge>
            </div>
            <ProgressBar value={Number(selected.progressPercentage || 0)} size="md" />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
