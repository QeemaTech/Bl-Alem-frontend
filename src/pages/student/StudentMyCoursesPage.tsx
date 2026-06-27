import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, PlayCircle } from '@/icons';
import { studentApi } from '../../api/student';
import {
  computeStats,
  CourseFilters,
  CourseGrid,
  CourseStatusChart,
  fmtDate,
  getDisplayStatus,
  LearningProgressCard,
  MyCoursesPageSkeleton,
  PAGE_SIZE,
  StatisticsCards,
  STATUS_LABELS,
  STATUS_VARIANT,
  type MyCourseEnrollment,
} from '../../components/student/myCourses';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Table } from '../../components/ui/Table';
import { exportTableToExcel } from '../../utils/exportExcel';

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
  const [tab, setTab] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  const [allItems, setAllItems] = useState<MyCourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    studentApi.myCourses('all').then(setAllItems).finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => computeStats(allItems), [allItems]);

  const categories = useMemo(() => {
    const names = new Set<string>();
    allItems.forEach((item) => {
      const name = item.course?.category?.nameAr;
      if (name) names.add(name);
    });
    return [
      { label: 'كل التصنيفات', value: '' },
      ...Array.from(names).sort((a, b) => a.localeCompare(b, 'ar')).map((name) => ({
        label: name,
        value: name,
      })),
    ];
  }, [allItems]);

  const tabItems = useMemo(() => {
    if (tab === 'active') {
      return allItems.filter((item) => getDisplayStatus(item) === 'ACTIVE');
    }
    if (tab === 'completed') {
      return allItems.filter((item) => getDisplayStatus(item) === 'COMPLETED');
    }
    if (tab === 'not_started') {
      return allItems.filter((item) => getDisplayStatus(item) === 'NOT_STARTED');
    }
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
    if (category) {
      result = result.filter((item) => item.course?.category?.nameAr === category);
    }
    result.sort((a, b) => {
      if (sort === 'progress') {
        return Number(b.progressPercentage || 0) - Number(a.progressPercentage || 0);
      }
      if (sort === 'name') {
        return String(a.course?.titleAr || '').localeCompare(String(b.course?.titleAr || ''), 'ar');
      }
      return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
    });
    return result;
  }, [tabItems, search, sort, category]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, sort, category, viewMode]);

  const tableRows = useMemo(() => filtered.map((item) => ({
    id: item.courseId,
    title: item.course?.titleAr || '—',
    instructor: item.course?.instructor?.fullName || '—',
    category: item.course?.category?.nameAr || '—',
    progress: Number(item.progressPercentage || 0),
    status: STATUS_LABELS[getDisplayStatus(item)],
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
    setCategory('');
  };

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
          <Button icon={<PlayCircle size={18} />} onClick={() => navigate('/student/courses')}>
            تصفح دورات جديدة
          </Button>
        </div>
      </div>

      <StatisticsCards stats={stats} />

      <div className="student-my-courses-insights">
        <LearningProgressCard stats={stats} />
        <CourseStatusChart stats={stats} />
      </div>

      <CourseFilters
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        tab={tab}
        onTabChange={setTab}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        stats={stats}
        resultCount={filtered.length}
        onReset={handleReset}
        resetDisabled={!search && sort === 'recent' && tab === 'all' && !category}
      />

      <CourseGrid
        items={filtered}
        page={page}
        onPageChange={setPage}
        viewMode={viewMode}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        showBrowseAction={!allItems.length}
        onBrowse={() => navigate('/student/courses')}
        tableView={(
          <Card className="student-my-courses-table-wrap">
            <Table
              data={tableRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
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
                    <Badge variant={STATUS_VARIANT(getDisplayStatus(row._raw))}>{row.status}</Badge>
                  ),
                },
                { key: 'quizzes', header: 'الاختبارات' },
                { key: 'enrolledAt', header: 'الاشتراك' },
                {
                  key: 'actions',
                  header: 'الإجراءات',
                  render: (row) => {
                    const done = getDisplayStatus(row._raw) === 'COMPLETED';
                    return (
                      <Button
                        size="sm"
                        icon={done ? <CheckCircle2 size={14} /> : <PlayCircle size={14} />}
                        onClick={() => (done
                          ? navigate('/student/certificates')
                          : navigate(`/student/player/${row.id}`))}
                      >
                        {done ? 'عرض الشهادة' : 'متابعة التعلم'}
                      </Button>
                    );
                  },
                },
              ]}
            />
          </Card>
        )}
      />
    </div>
  );
}
