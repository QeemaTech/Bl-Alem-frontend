import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CheckCircle2, Download, GraduationCap, PlayCircle, UserRound,
} from 'lucide-react';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { CourseGridSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { ReportChart } from '../../components/reports/ReportChart';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { exportTableToExcel } from '../../utils/exportExcel';

const statusLabels: Record<string, string> = {
  ACTIVE: 'قيد التعلم',
  COMPLETED: 'مكتملة',
};

const statusVariant = (status: string) => (status === 'COMPLETED' ? 'success' as const : 'info' as const);

const fmtDate = (value?: string) => (value
  ? new Date(value).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
  : '—');

const exportColumns = [
  { key: 'title', header: 'الدورة' },
  { key: 'instructor', header: 'المحاضر' },
  { key: 'category', header: 'التصنيف' },
  { key: 'progress', header: 'التقدم %' },
  { key: 'status', header: 'الحالة' },
  { key: 'enrolledAt', header: 'تاريخ الاشتراك' },
  { key: 'lessons', header: 'عدد الدروس' },
  { key: 'quizzes', header: 'عدد الاختبارات' },
];

export default function StudentMyCoursesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');
  const [viewMode, setViewMode] = useState('cards');
  const [allItems, setAllItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');

  useEffect(() => {
    setLoading(true);
    studentApi.myCourses('all').then(setAllItems).finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const active = allItems.filter((i) => i.status === 'ACTIVE');
    const completed = allItems.filter((i) => i.status === 'COMPLETED');
    const avgProgress = allItems.length
      ? Math.round(allItems.reduce((sum, i) => sum + Number(i.progressPercentage || 0), 0) / allItems.length)
      : 0;
    return {
      total: allItems.length,
      active: active.length,
      completed: completed.length,
      avgProgress,
    };
  }, [allItems]);

  const chartData = useMemo(() => [
    { label: 'قيد التعلم', value: stats.active },
    { label: 'مكتملة', value: stats.completed },
  ].filter((d) => d.value > 0), [stats]);

  const tabItems = useMemo(() => {
    if (tab === 'active') return allItems.filter((i) => i.status === 'ACTIVE');
    if (tab === 'completed') return allItems.filter((i) => i.status === 'COMPLETED');
    return allItems;
  }, [allItems, tab]);

  const filtered = useMemo(() => {
    let result = [...tabItems];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((item) =>
        [item.course?.titleAr, item.course?.instructor?.fullName, item.course?.category?.nameAr]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    result.sort((a, b) => {
      if (sort === 'progress') return Number(b.progressPercentage || 0) - Number(a.progressPercentage || 0);
      if (sort === 'name') return String(a.course?.titleAr || '').localeCompare(String(b.course?.titleAr || ''), 'ar');
      return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
    });
    return result;
  }, [tabItems, search, sort]);

  const tableRows = useMemo(() => filtered.map((item) => ({
    id: item.courseId,
    title: item.course?.titleAr || '—',
    instructor: item.course?.instructor?.fullName || '—',
    category: item.course?.category?.nameAr || '—',
    progress: Number(item.progressPercentage || 0),
    status: statusLabels[item.status] || item.status,
    enrolledAt: fmtDate(item.enrolledAt),
    lessons: item.course?._count?.lessons || 0,
    quizzes: item.course?.quizzes?.length || 0,
    _raw: item,
  })), [filtered]);

  const handleExport = () => {
    exportTableToExcel('كورساتي', exportColumns, tableRows.map(({ _raw, ...row }) => row));
  };

  const renderCourseCard = (item: any) => {
    const progress = Number(item.progressPercentage || 0);
    const isCompleted = item.status === 'COMPLETED' || progress >= 100;
    const quizCount = item.course?.quizzes?.length || 0;
    return (
      <Card key={item.id} className={`my-course-card enhanced ${isCompleted ? 'completed' : ''}`}>
        <div className="course-cover">
          {item.course?.coverImage ? (
            <img src={item.course.coverImage} alt="" />
          ) : (
            <span className="course-cover-fallback"><BookOpen size={32} /></span>
          )}
          <Badge variant={statusVariant(item.status)} className="my-course-status-badge">
            {statusLabels[item.status] || item.status}
          </Badge>
        </div>
        <div className="my-course-card-body">
          <span className="my-course-category">{item.course?.category?.nameAr || 'دورة'}</span>
          <h3>{item.course?.titleAr}</h3>
          <p><UserRound size={14} /> {item.course?.instructor?.fullName || '—'}</p>
          <div className="my-course-meta">
            <span>{item.course?._count?.lessons || 0} درس</span>
            {quizCount ? <span>{quizCount} اختبار</span> : null}
            <span>اشتركت {fmtDate(item.enrolledAt)}</span>
          </div>
          {quizCount && !isCompleted ? (
            <Badge variant="info">لديك اختبارات معلّقة</Badge>
          ) : null}
          <ProgressBar value={progress} label="التقدم" size="md" />
          <Button
            fullWidth
            variant={isCompleted ? 'secondary' : 'primary'}
            icon={isCompleted ? <CheckCircle2 size={16} /> : <PlayCircle size={16} />}
            onClick={() => navigate(`/student/player/${item.courseId}`)}
          >
            {isCompleted ? 'مراجعة الدورة' : 'استكمال'}
          </Button>
        </div>
      </Card>
    );
  };

  if (loading) return <CourseGridSkeleton />;

  return (
    <div className="page-grid student-my-courses-page">
      <div className="reports-header">
        <PageHeader
          title="كورساتي"
          subtitle="تابع الدورات التي اشتركت بها واستكمل التعلم"
        />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!filtered.length}>
            تصدير Excel
          </Button>
          <Button icon={<BookOpen size={18} />} onClick={() => navigate('/student/courses')}>
            تصفح دورات جديدة
          </Button>
        </div>
      </div>

      <Card className="student-my-courses-hero">
        <div className="student-my-courses-hero-icon">
          <GraduationCap size={32} />
        </div>
        <div className="student-my-courses-hero-body">
          <strong>رحلتك التعليمية</strong>
          <p>
            {stats.total
              ? `لديك ${stats.total} دورة — متوسط التقدم ${stats.avgProgress}%`
              : 'ابدأ رحلتك بالاشتراك في دورة من الكورسات المتاحة.'}
          </p>
        </div>
      </Card>

      <div className="stats-grid">
        <StatCard title="إجمالي الدورات" value={String(stats.total)} icon={BookOpen} />
        <StatCard title="قيد التعلم" value={String(stats.active)} icon={PlayCircle} />
        <StatCard title="مكتملة" value={String(stats.completed)} icon={CheckCircle2} />
        <StatCard title="متوسط التقدم" value={`${stats.avgProgress}%`} icon={GraduationCap} />
      </div>

      {chartData.length ? (
        <div className="reports-charts-grid student-my-courses-charts">
          <ReportChart title="حالة الدورات" type="pie" data={chartData} />
        </div>
      ) : null}

      <Tabs
        variant="pills"
        activeTab={tab}
        onChange={setTab}
        tabs={[
          { id: 'active', label: `قيد التعلم (${stats.active})` },
          { id: 'completed', label: `مكتملة (${stats.completed})` },
          { id: 'all', label: `الكل (${stats.total})` },
        ]}
      />

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث باسم الدورة أو المحاضر..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setSort('recent'); }}
      >
        <Select
          label="الترتيب"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          options={[
            { label: 'الأحدث اشتراكاً', value: 'recent' },
            { label: 'الأعلى تقدماً', value: 'progress' },
            { label: 'الاسم', value: 'name' },
          ]}
        />
      </FilterBar>

      <Tabs
        variant="pills"
        activeTab={viewMode}
        onChange={setViewMode}
        tabs={[
          { id: 'cards', label: `البطاقات (${filtered.length})` },
          { id: 'table', label: `الجدول (${filtered.length})` },
        ]}
      />

      {viewMode === 'cards' ? (
        filtered.length ? (
          <div className="course-list-grid">
            {filtered.map(renderCourseCard)}
          </div>
        ) : (
          <Card>
            <EmptyState
              title="لا توجد دورات"
              description={allItems.length ? 'لا توجد دورات مطابقة للفلاتر.' : 'اشترك في دورة من صفحة الكورسات المتاحة لتظهر هنا.'}
              icon={BookOpen}
              actionLabel="تصفح الكورسات"
              onAction={() => navigate('/student/courses')}
            />
          </Card>
        )
      ) : (
        <Card>
          <Table
            data={tableRows}
            emptyTitle="لا توجد دورات"
            emptyDescription="لا توجد دورات مطابقة."
            columns={[
              { key: 'title', header: 'الدورة' },
              { key: 'instructor', header: 'المحاضر' },
              { key: 'category', header: 'التصنيف' },
              {
                key: 'progress',
                header: 'التقدم',
                render: (row) => (
                  <div className="table-progress-cell">
                    <ProgressBar value={Number(row.progress)} size="sm" />
                    <span>{row.progress}%</span>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'الحالة',
                render: (row) => (
                  <Badge variant={statusVariant(String(row._raw?.status))}>{row.status}</Badge>
                ),
              },
              { key: 'quizzes', header: 'الاختبارات' },
              { key: 'enrolledAt', header: 'الاشتراك' },
              {
                key: 'actions',
                header: 'الإجراءات',
                render: (row) => (
                  <Button size="sm" icon={<PlayCircle size={14} />} onClick={() => navigate(`/student/player/${row.id}`)}>
                    {Number(row.progress) >= 100 ? 'مراجعة' : 'استكمال'}
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
