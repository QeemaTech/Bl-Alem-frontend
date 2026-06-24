import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
<<<<<<< Updated upstream
  BookOpen, CheckCircle2, Download, GraduationCap, PlayCircle, RotateCcw, Search,
} from 'lucide-react';
=======
  BookOpen, CheckCircle2, Download, GraduationCap, PlayCircle, UserRound,
} from '@/icons';
>>>>>>> Stashed changes
import { studentApi } from '../../api/student';
import { MyCourseCard } from '../../components/student/MyCourseCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
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

function MyCoursesPageSkeleton() {
  return (
    <div className="page-grid student-my-courses-page">
      <div className="skeleton skeleton-block student-my-courses-skeleton-header" />
      <div className="stats-grid student-my-courses-stats">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-stat" />
        ))}
      </div>
      <div className="student-my-courses-insights">
        <div className="skeleton skeleton-block student-my-courses-skeleton-journey" />
        <div className="skeleton skeleton-block student-my-courses-skeleton-chart" />
      </div>
      <div className="skeleton skeleton-block student-my-courses-skeleton-toolbar" />
      <div className="course-list-grid student-my-courses-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-card student-my-courses-skeleton-card" />
        ))}
      </div>
    </div>
  );
}

export default function StudentMyCoursesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
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

  const handleReset = () => {
    setSearch('');
    setSort('recent');
    setTab('all');
  };

  const journeyMessage = useMemo(() => {
    if (!stats.total) return 'ابدأ رحلتك بالاشتراك في دورة من الكورسات المتاحة.';
    if (stats.avgProgress >= 100) return 'ممتاز! أكملت جميع دوراتك المسجّلة.';
    if (stats.avgProgress >= 50) return 'أنت في منتصف الطريق — استمر في التعلّم!';
    return 'بداية قوية — كل درس يقربك من هدفك.';
  }, [stats]);

  const emptyTitle = allItems.length ? 'لا توجد نتائج مطابقة' : 'لا توجد دورات';
  const emptyDescription = allItems.length
    ? 'جرّبي تغيير البحث أو الفلتر للعثور على دوراتك.'
    : 'اشترك في دورة من صفحة الكورسات المتاحة لتظهر هنا.';

  if (loading) return <MyCoursesPageSkeleton />;

  return (
    <div className="page-grid student-my-courses-page">
      <div className="reports-header student-my-courses-header">
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

      <div className="stats-grid student-my-courses-stats">
        <StatCard title="إجمالي الدورات" value={String(stats.total)} icon={BookOpen} />
        <StatCard title="قيد التعلم" value={String(stats.active)} icon={PlayCircle} />
        <StatCard title="مكتملة" value={String(stats.completed)} icon={CheckCircle2} />
        <StatCard title="متوسط التقدم" value={`${stats.avgProgress}%`} icon={GraduationCap} />
      </div>

      <div className="student-my-courses-insights">
        <Card className="student-journey-card">
          <div className="student-journey-head">
            <span className="student-journey-icon"><GraduationCap size={22} /></span>
            <div className="student-journey-copy">
              <strong>رحلتك التعليمية</strong>
              <p>{journeyMessage}</p>
            </div>
            <span className="student-journey-percent">{stats.avgProgress}%</span>
          </div>
          <ProgressBar value={stats.avgProgress} label="متوسط إكمال الدورات" size="md" />
          {stats.total ? (
            <p className="student-journey-foot">
              {stats.completed} مكتملة · {stats.active} قيد التعلم · {stats.total} إجمالاً
            </p>
          ) : null}
        </Card>

        {chartData.length ? (
          <div className="student-my-courses-chart-wrap">
            <ReportChart title="حالة الدورات" type="pie" data={chartData} height={168} />
          </div>
        ) : null}
      </div>

      <div className="student-my-courses-toolbar">
        <div className="student-my-courses-toolbar-search">
          <Input
            label="بحث"
            placeholder="بحث باسم الدورة أو المحاضر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={18} />}
          />
        </div>
        <div className="student-my-courses-toolbar-sort">
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
        </div>
        <button
          type="button"
          className="student-my-courses-toolbar-reset"
          onClick={handleReset}
        >
          <RotateCcw size={15} />
          إعادة تعيين
        </button>
        <div className="student-my-courses-toolbar-tabs">
          <Tabs
            variant="pills"
            activeTab={tab}
            onChange={setTab}
            tabs={[
              { id: 'all', label: `الكل (${stats.total})` },
              { id: 'active', label: `قيد التعلم (${stats.active})` },
              { id: 'completed', label: `مكتملة (${stats.completed})` },
            ]}
          />
        </div>
        <div className="student-my-courses-toolbar-view">
          <Tabs
            variant="pills"
            activeTab={viewMode}
            onChange={setViewMode}
            tabs={[
              { id: 'cards', label: `البطاقات (${filtered.length})` },
              { id: 'table', label: `الجدول (${filtered.length})` },
            ]}
          />
        </div>
      </div>

      {viewMode === 'cards' ? (
        filtered.length ? (
          <div className="course-list-grid student-my-courses-grid">
            {filtered.map((item, index) => (
              <MyCourseCard
                key={item.id}
                item={item}
                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
              />
            ))}
          </div>
        ) : (
          <Card className="student-my-courses-empty">
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              icon={BookOpen}
              actionLabel={allItems.length ? undefined : 'تصفح الكورسات'}
              onAction={allItems.length ? undefined : () => navigate('/student/courses')}
            />
          </Card>
        )
      ) : (
        <Card className="student-my-courses-table-wrap">
          <Table
            data={tableRows}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
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
