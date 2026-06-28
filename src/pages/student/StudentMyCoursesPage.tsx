import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, PlayCircle } from '@/icons';
import { studentApi } from '../../api/student';
import {
  computeStats,
  CourseFilters,
  CourseGrid,
  CourseStatusChart,
  getDisplayStatus,
  LearningProgressCard,
  MyCoursesPageSkeleton,
  PAGE_SIZE,
  StatisticsCards,
  STATUS_VARIANT,
  type MyCourseEnrollment,
} from '../../components/student/myCourses';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Table } from '../../components/ui/Table';
import { useStudentMyCourseLabels } from '../../hooks/useStudentMyCourseLabels';
import { localizedCategoryName, localizedCourseTitle } from '../../utils/localizedContent';
import { exportTableToExcel } from '../../utils/exportExcel';

export default function StudentMyCoursesPage() {
  const { t, i18n } = useTranslation('courses');
  const lang = i18n.language;
  const { getStatusLabel, fmtDate } = useStudentMyCourseLabels();
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
    const names = new Map<string, string>();
    allItems.forEach((item) => {
      const cat = item.course?.category;
      if (!cat) return;
      const label = localizedCategoryName(cat, lang);
      if (label && label !== '—') names.set(label, label);
    });
    return [
      { label: t('student.myCourses.filters.allCategories'), value: '' },
      ...Array.from(names.values()).sort((a, b) => a.localeCompare(b, lang)).map((name) => ({
        label: name,
        value: name,
      })),
    ];
  }, [allItems, lang, t]);

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
        [
          localizedCourseTitle(item.course, lang),
          item.course?.instructor?.fullName,
          localizedCategoryName(item.course?.category, lang),
        ].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    if (category) {
      result = result.filter((item) => localizedCategoryName(item.course?.category, lang) === category);
    }
    result.sort((a, b) => {
      if (sort === 'progress') {
        return Number(b.progressPercentage || 0) - Number(a.progressPercentage || 0);
      }
      if (sort === 'name') {
        return localizedCourseTitle(a.course, lang).localeCompare(localizedCourseTitle(b.course, lang), lang);
      }
      return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
    });
    return result;
  }, [tabItems, search, sort, category, lang]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, sort, category, viewMode]);

  const exportColumns = useMemo(() => [
    { key: 'title', header: t('student.myCourses.export.columns.title') },
    { key: 'instructor', header: t('student.myCourses.export.columns.instructor') },
    { key: 'category', header: t('student.myCourses.export.columns.category') },
    { key: 'progress', header: t('student.myCourses.export.columns.progress') },
    { key: 'status', header: t('student.myCourses.export.columns.status') },
    { key: 'enrolledAt', header: t('student.myCourses.export.columns.enrolledAt') },
    { key: 'lessons', header: t('student.myCourses.export.columns.lessons') },
    { key: 'quizzes', header: t('student.myCourses.export.columns.quizzes') },
  ], [t, lang]);

  const tableRows = useMemo(() => filtered.map((item) => ({
    id: item.courseId,
    title: localizedCourseTitle(item.course, lang),
    instructor: item.course?.instructor?.fullName || '—',
    category: localizedCategoryName(item.course?.category, lang),
    progress: Number(item.progressPercentage || 0),
    status: getStatusLabel(getDisplayStatus(item)),
    enrolledAt: fmtDate(item.enrolledAt),
    lessons: item.course?._count?.lessons || 0,
    quizzes: item.course?.quizzes?.length || 0,
    _raw: item,
  })), [filtered, getStatusLabel, fmtDate, lang]);

  const handleExport = () => {
    exportTableToExcel(
      t('student.myCourses.export.sheetName'),
      exportColumns,
      tableRows.map(({ _raw, ...row }) => row),
    );
  };

  const handleReset = () => {
    setSearch('');
    setSort('recent');
    setTab('all');
    setCategory('');
  };

  const emptyTitle = allItems.length
    ? t('student.myCourses.empty.noResults')
    : t('student.myCourses.empty.noCourses');
  const emptyDescription = allItems.length
    ? t('student.myCourses.empty.noResultsDesc')
    : t('student.myCourses.empty.noCoursesDesc');

  const tableColumns = useMemo(() => [
    { key: 'title', header: t('student.myCourses.table.columns.title') },
    { key: 'instructor', header: t('student.myCourses.table.columns.instructor') },
    { key: 'category', header: t('student.myCourses.table.columns.category') },
    {
      key: 'progress',
      header: t('student.myCourses.table.columns.progress'),
      render: (row: typeof tableRows[number]) => (
        <div className="table-progress-cell">
          <ProgressBar value={Number(row.progress)} size="sm" />
          <span>{row.progress}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('student.myCourses.table.columns.status'),
      render: (row: typeof tableRows[number]) => (
        <Badge variant={STATUS_VARIANT(getDisplayStatus(row._raw))}>{row.status}</Badge>
      ),
    },
    { key: 'quizzes', header: t('student.myCourses.table.columns.quizzes') },
    { key: 'enrolledAt', header: t('student.myCourses.table.columns.enrolled') },
    {
      key: 'actions',
      header: t('student.myCourses.table.columns.actions'),
      render: (row: typeof tableRows[number]) => {
        const done = getDisplayStatus(row._raw) === 'COMPLETED';
        return (
          <Button
            size="sm"
            icon={done ? <CheckCircle2 size={14} /> : <PlayCircle size={14} />}
            onClick={() => (done
              ? navigate('/student/certificates')
              : navigate(`/student/player/${row.id}`))}
          >
            {done
              ? t('student.myCourses.actions.viewCertificate')
              : t('student.myCourses.actions.continueLearning')}
          </Button>
        );
      },
    },
  ], [t, lang, navigate]);

  if (loading) return <MyCoursesPageSkeleton />;

  return (
    <div className="page-grid student-my-courses-page">
      <div className="reports-header student-my-courses-header">
        <PageHeader
          title={t('student.myCourses.title')}
          subtitle={t('student.myCourses.subtitle')}
        />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!filtered.length}>
            {t('student.myCourses.exportExcel')}
          </Button>
          <Button icon={<PlayCircle size={18} />} onClick={() => navigate('/student/courses')}>
            {t('student.myCourses.browseNew')}
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
              columns={tableColumns}
            />
          </Card>
        )}
      />
    </div>
  );
}
