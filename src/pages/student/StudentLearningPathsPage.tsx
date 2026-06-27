import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight, BookOpen, CheckCircle2, Download, GraduationCap, PlayCircle, Route, Target,
  UserRound,
} from '@/icons';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LearningPathCourseCard } from '../../components/student/LearningPathCourseCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ReportChart } from '../../components/reports/ReportChart';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';

const exportColumns = [
  { key: 'title', header: 'المسار' },
  { key: 'courses', header: 'عدد الدورات' },
  { key: 'enrolled', header: 'مسجّلة' },
  { key: 'completed', header: 'مكتملة' },
  { key: 'progress', header: 'التقدم %' },
  { key: 'status', header: 'الحالة' },
];

type EnrollmentMap = Map<number, { status: string; progressPercentage: number }>;

const getPathStats = (path: any, enrollmentMap: EnrollmentMap) => {
  const items = path.courses || [];
  const courseIds = items.map((item: any) => item.courseId);
  let enrolled = 0;
  let completed = 0;
  courseIds.forEach((id: number) => {
    const e = enrollmentMap.get(id);
    if (e) {
      enrolled += 1;
      if (e.status === 'COMPLETED' || Number(e.progressPercentage) >= 100) completed += 1;
    }
  });
  const total = courseIds.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const status = completed === total && total > 0
    ? 'completed'
    : enrolled > 0
      ? 'in_progress'
      : 'not_started';
  return { total, enrolled, completed, progress, status };
};

const pathStatusLabel = (status: string) => {
  if (status === 'completed') return 'مكتمل';
  if (status === 'in_progress') return 'قيد التعلم';
  return 'لم يبدأ';
};

const pathStatusVariant = (status: string) => {
  if (status === 'completed') return 'success' as const;
  if (status === 'in_progress') return 'info' as const;
  return 'default' as const;
};

export default function StudentLearningPathsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [paths, setPaths] = useState<any[]>([]);
  const [path, setPath] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [enrolling, setEnrolling] = useState(false);

  const enrollmentMap = useMemo(() => {
    const map: EnrollmentMap = new Map();
    enrollments.forEach((e) => {
      map.set(e.courseId, {
        status: e.status,
        progressPercentage: Number(e.progressPercentage || 0),
      });
    });
    return map;
  }, [enrollments]);

  useEffect(() => {
    setLoading(true);
    const loadEnrollments = studentApi.myCourses('all').then(setEnrollments);
    if (id) {
      Promise.all([studentApi.learningPath(id), loadEnrollments])
        .then(([pathData]) => setPath(pathData))
        .finally(() => setLoading(false));
      return;
    }
    Promise.all([studentApi.learningPaths(), loadEnrollments])
      .then(([pathsData]) => setPaths(pathsData))
      .finally(() => setLoading(false));
  }, [id]);

  const listStats = useMemo(() => {
    let started = 0;
    let completed = 0;
    let totalCourses = 0;
    paths.forEach((p) => {
      const s = getPathStats(p, enrollmentMap);
      totalCourses += s.total;
      if (s.status === 'in_progress') started += 1;
      if (s.status === 'completed') completed += 1;
    });
    return {
      paths: paths.length,
      started,
      completed,
      totalCourses,
    };
  }, [paths, enrollmentMap]);

  const chartData = useMemo(() => [
    { label: 'مكتملة', value: listStats.completed },
    { label: 'قيد التعلم', value: listStats.started },
    { label: 'لم تبدأ', value: Math.max(0, listStats.paths - listStats.completed - listStats.started) },
  ].filter((d) => d.value > 0), [listStats]);

  const filteredPaths = useMemo(() => {
    let result = paths.map((p) => ({ ...p, stats: getPathStats(p, enrollmentMap) }));
    if (statusFilter) result = result.filter((p) => p.stats.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) =>
        [p.titleAr, p.descriptionAr].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [paths, enrollmentMap, search, statusFilter]);

  const tableRows = useMemo(() => filteredPaths.map((p) => ({
    id: p.id,
    title: p.titleAr,
    courses: p.stats.total,
    enrolled: p.stats.enrolled,
    completed: p.stats.completed,
    progress: p.stats.progress,
    status: pathStatusLabel(p.stats.status),
    _raw: p,
  })), [filteredPaths]);

  const handleExport = () => {
    exportTableToExcel('المسارات-التعليمية', exportColumns, tableRows.map(({ _raw, ...row }) => row));
  };

  const renderPathCard = (item: any) => {
    const s = item.stats || getPathStats(item, enrollmentMap);
    return (
      <Card key={item.id} className="learning-path-card student-learning-path-card">
        <div className="learning-path-top">
          <span className="learning-path-icon"><Route size={22} /></span>
          <span className="learning-path-count">{s.total} دورات</span>
        </div>
        <Badge variant={pathStatusVariant(s.status)}>{pathStatusLabel(s.status)}</Badge>
        <h3>{item.titleAr}</h3>
        <p>{item.descriptionAr || 'مسار تعليمي منظم'}</p>
        {s.enrolled > 0 ? (
          <ProgressBar value={s.progress} label="تقدم المسار" size="sm" />
        ) : null}
        <div className="student-learning-path-meta">
          <span>{s.enrolled} مسجّلة</span>
          <span>{s.completed} مكتملة</span>
        </div>
        <Link to={`/student/learning-paths/${item.id}`} className="learning-path-action">
          <Button size="sm" fullWidth variant={s.status === 'completed' ? 'secondary' : 'primary'}>
            {s.status === 'completed' ? 'مراجعة المسار' : 'استكشف المسار'}
          </Button>
        </Link>
      </Card>
    );
  };

  if (loading) return <DashboardSkeleton />;

  if (id && path) {
    const pathStats = getPathStats(path, enrollmentMap);
    const courses = path.courses || [];

    const enrollAll = async () => {
      setEnrolling(true);
      try {
        await studentApi.enrollLearningPath(path.id, { gateway: 'SIMULATED' });
        showToast('تم الاشتراك في دورات المسار بنجاح.', 'success');
        const [updatedPath, updatedEnrollments] = await Promise.all([
          studentApi.learningPath(path.id),
          studentApi.myCourses('all'),
        ]);
        setPath(updatedPath);
        setEnrollments(updatedEnrollments);
      } catch {
        showToast('تعذّر الاشتراك في المسار.', 'error');
      } finally {
        setEnrolling(false);
      }
    };

    return (
      <div className="page-grid student-learning-path-detail">
        <div className="reports-header student-learning-path-detail-header">
          <PageHeader
            title={path.titleAr}
            subtitle={path.descriptionAr || 'مسار تعليمي منظم'}
            breadcrumb={[
              { label: 'المسارات التعليمية', to: '/student/learning-paths' },
              { label: path.titleAr },
            ]}
          />
          <div className="reports-header-actions">
            <Link to="/student/learning-paths">
              <Button variant="outline" size="sm" icon={<ArrowRight size={16} />}>
                العودة للمسارات
              </Button>
            </Link>
          </div>
        </div>

        <div className="stats-grid student-learning-path-detail-stats">
          <StatCard title="دورات المسار" value={String(pathStats.total)} icon={BookOpen} />
          <StatCard title="مسجّلة" value={String(pathStats.enrolled)} icon={PlayCircle} />
          <StatCard title="مكتملة" value={String(pathStats.completed)} icon={CheckCircle2} />
          <StatCard title="تقدم المسار" value={`${pathStats.progress}%`} icon={Target} />
        </div>

        <div className="student-learning-path-detail-insights">
          <Card className="student-path-journey-card">
            <div className="student-path-journey-head">
              <span className="student-path-journey-icon"><Route size={22} /></span>
              <div className="student-path-journey-copy">
                <strong>التقدم الكلي للمسار</strong>
                <p>
                  {pathStats.completed === pathStats.total && pathStats.total > 0
                    ? 'أحسنت! أكملت جميع دورات هذا المسار.'
                    : pathStats.enrolled > 0
                      ? `${pathStats.completed} من ${pathStats.total} دورات مكتملة — استمر في التعلّم.`
                      : 'اشترك في دورات المسار لبدء رحلتك التعليمية.'}
                </p>
              </div>
              <span className="student-path-journey-percent">{pathStats.progress}%</span>
            </div>
            <ProgressBar value={pathStats.progress} label="نسبة الإكمال" size="md" />
            {pathStats.total ? (
              <p className="student-path-journey-foot">
                {pathStats.enrolled} مسجّلة · {pathStats.completed} مكتملة · {pathStats.total} إجمالاً
              </p>
            ) : null}
          </Card>

          {pathStats.enrolled < pathStats.total ? (
            <Card className="student-path-enroll-card">
              <div className="student-path-enroll-icon" aria-hidden>
                <GraduationCap size={26} />
              </div>
              <div className="student-path-enroll-copy">
                <strong>اشترك في جميع دورات المسار</strong>
                <p>سيتم تسجيلك في كل دورات المسار المتاحة دفعة واحدة.</p>
              </div>
              <Button
                loading={enrolling}
                onClick={enrollAll}
                icon={<GraduationCap size={16} />}
                className="student-path-enroll-btn"
              >
                اشترك الآن
              </Button>
            </Card>
          ) : null}
        </div>

        <Card className="student-path-timeline">
          <div className="section-heading student-path-timeline-heading">
            <h2><Route size={18} /> مسار الدورات</h2>
            <span className="muted-count">{courses.length} خطوة</span>
          </div>
          <div className="student-path-steps">
            {courses.map((item: any, index: number) => {
              const enrollment = enrollmentMap.get(item.courseId);
              const done = enrollment && (enrollment.status === 'COMPLETED' || enrollment.progressPercentage >= 100);
              const enrolled = Boolean(enrollment);
              return (
                <div
                  key={item.id}
                  className={`student-path-step ${done ? 'done' : enrolled ? 'active' : ''}`}
                >
                  <span className="student-path-step-num" aria-hidden>
                    {done ? <CheckCircle2 size={18} /> : index + 1}
                  </span>
                  <div className="student-path-step-body">
                    <strong>{item.course?.titleAr}</strong>
                    <span><UserRound size={12} /> {item.course?.instructor?.fullName || '—'}</span>
                    {enrolled ? (
                      <ProgressBar value={enrollment?.progressPercentage || 0} size="sm" />
                    ) : null}
                  </div>
                  <Badge variant={done ? 'success' : enrolled ? 'info' : 'default'}>
                    {done ? 'مكتمل' : enrolled ? 'قيد التعلم' : 'غير مسجّل'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <section className="student-learning-path-courses-section">
          <div className="section-heading student-learning-path-courses-heading">
            <h2><BookOpen size={18} /> دورات المسار</h2>
            <span className="muted-count">{courses.length} دورة</span>
          </div>
          <div className="course-list-grid student-learning-path-courses-grid">
            {courses.map((item: any, index: number) => {
              const enrollment = enrollmentMap.get(item.courseId);
              return (
                <LearningPathCourseCard
                  key={item.id}
                  stepNumber={index + 1}
                  course={item.course}
                  enrollment={enrollment}
                  style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                  onPrimaryAction={() => {
                    if (enrollment) navigate(`/student/player/${item.courseId}`);
                    else navigate(`/student/courses/${item.courseId}`);
                  }}
                  onViewDetails={() => navigate(`/student/courses/${item.courseId}`)}
                />
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-grid student-learning-paths-page">
      <div className="reports-header">
        <PageHeader
          title="المسارات التعليمية"
          subtitle="تعلّم بشكل منظم عبر مسارات متسلسلة"
        />
        <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!filteredPaths.length}>
          تصدير Excel
        </Button>
      </div>

      <Card className="student-learning-paths-hero">
        <div className="student-learning-paths-hero-icon">
          <GraduationCap size={32} />
        </div>
        <div className="student-learning-paths-hero-body">
          <strong>خطط تعلم منظّمة</strong>
          <p>
            {listStats.paths
              ? `${listStats.paths} مسارات متاحة — ${listStats.totalCourses} دورة ضمن المسارات`
              : 'ستُضاف مسارات تعليمية قريباً.'}
          </p>
        </div>
      </Card>

      <div className="stats-grid">
        <StatCard title="المسارات" value={String(listStats.paths)} icon={Route} />
        <StatCard title="قيد التعلم" value={String(listStats.started)} icon={PlayCircle} />
        <StatCard title="مكتملة" value={String(listStats.completed)} icon={CheckCircle2} />
        <StatCard title="إجمالي الدورات" value={String(listStats.totalCourses)} icon={BookOpen} />
      </div>

      {chartData.length ? (
        <div className="reports-charts-grid student-learning-paths-charts">
          <ReportChart title="حالة المسارات" type="pie" data={chartData} />
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث باسم المسار أو الوصف..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label="الحالة"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'لم يبدأ', value: 'not_started' },
            { label: 'قيد التعلم', value: 'in_progress' },
            { label: 'مكتمل', value: 'completed' },
          ]}
        />
      </FilterBar>

      <Tabs
        variant="pills"
        activeTab={viewMode}
        onChange={setViewMode}
        tabs={[
          { id: 'cards', label: `البطاقات (${filteredPaths.length})` },
          { id: 'table', label: `الجدول (${filteredPaths.length})` },
        ]}
      />

      {viewMode === 'cards' ? (
        filteredPaths.length ? (
          <div className="learning-paths-grid student-learning-paths-grid">
            {filteredPaths.map(renderPathCard)}
          </div>
        ) : (
          <Card>
            <EmptyState
              title="لا توجد مسارات"
              description={paths.length ? 'لا توجد مسارات مطابقة للفلاتر.' : 'ستُضاف مسارات تعليمية قريباً.'}
              icon={Route}
            />
          </Card>
        )
      ) : (
        <Card>
          <Table
            data={tableRows}
            emptyTitle="لا توجد مسارات"
            emptyDescription="لا توجد مسارات مطابقة."
            columns={[
              { key: 'title', header: 'المسار' },
              { key: 'courses', header: 'الدورات' },
              { key: 'enrolled', header: 'مسجّلة' },
              { key: 'completed', header: 'مكتملة' },
              {
                key: 'progress',
                header: 'التقدم',
                render: (row) => `${row.progress}%`,
              },
              {
                key: 'status',
                header: 'الحالة',
                render: (row) => (
                  <Badge variant={pathStatusVariant(String(row._raw?.stats?.status))}>{row.status}</Badge>
                ),
              },
              {
                key: 'actions',
                header: 'الإجراءات',
                render: (row) => (
                  <Button size="sm" onClick={() => navigate(`/student/learning-paths/${row.id}`)}>
                    عرض
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
