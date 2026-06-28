import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Download, GraduationCap, LayoutGrid, Search, Star, Users,
} from '@/icons';
import { studentApi } from '../../api/student';
import { StudentCourseCard } from '../../components/student/StudentCourseCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { ReportChart } from '../../components/reports/ReportChart';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { useStudentCourseLabels } from '../../hooks/useStudentCourseLabels';
import { localizedCategoryName, localizedCourseTitle } from '../../utils/localizedContent';
import { formatMoney } from '../../utils/formatMoney';
import { exportTableToExcel } from '../../utils/exportExcel';

function StudentCoursesGridSkeleton() {
  return (
    <div className="course-list-grid student-courses-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card student-courses-skeleton-card" />
      ))}
    </div>
  );
}

export default function StudentCoursesPage() {
  const { t, i18n } = useTranslation('courses');
  const { t: tc } = useTranslation('common');
  const lang = i18n.language;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    getLevelLabel,
    getEnrollmentLabel,
    getPrimaryActionLabel,
    typeLabels,
    otherCategory,
  } = useStudentCourseLabels();
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards');
  const [filters, setFilters] = useState<Record<string, string>>(() => ({
    sort: searchParams.get('sort') || 'latest',
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    level: '',
    type: '',
    price: '',
  }));

  const exportColumns = useMemo(() => [
    { key: 'title', header: t('student.browse.export.columns.title') },
    { key: 'category', header: t('student.browse.export.columns.category') },
    { key: 'instructor', header: t('student.browse.export.columns.instructor') },
    { key: 'level', header: t('student.browse.export.columns.level') },
    { key: 'price', header: t('student.browse.export.columns.price') },
    { key: 'rating', header: t('student.browse.export.columns.rating') },
    { key: 'lessons', header: t('student.browse.export.columns.lessons') },
    { key: 'enrolled', header: t('student.browse.export.columns.enrolled') },
  ], [t, lang]);

  const load = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const apiFilters = { ...nextFilters };
      if (apiFilters.search) apiFilters.search = apiFilters.search.trim();
      const [courseData, categoryData, myCourses] = await Promise.all([
        studentApi.courses(apiFilters),
        studentApi.categories(),
        studentApi.myCourses('all').catch(() => []),
      ]);
      setCourses(courseData);
      setCategories(categoryData);
      setEnrolledIds(new Set(myCourses.map((e: any) => e.courseId)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(filters); }, []);

  const updateFilter = (key: string, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const applyFilters = () => load(filters);

  const resetFilters = () => {
    const defaults = { sort: 'latest', search: '', category: '', level: '', type: '', price: '' };
    setFilters(defaults);
    load(defaults);
  };

  const stats = useMemo(() => {
    const free = courses.filter((c) => Number(c.discountPrice ?? c.price ?? 0) === 0).length;
    const discounted = courses.filter((c) => c.discountPrice != null && c.discountPrice < c.price).length;
    const enrolled = courses.filter((c) => enrolledIds.has(c.id)).length;
    const avgRating = courses.length
      ? (courses.reduce((sum, c) => sum + Number(c.ratingAverage || 0), 0) / courses.length).toFixed(1)
      : '0';
    return { total: courses.length, free, discounted, enrolled, avgRating };
  }, [courses, enrolledIds]);

  const categoryChart = useMemo(() => {
    const counts: Record<string, number> = {};
    courses.forEach((c) => {
      const name = localizedCategoryName(c.category, lang) || otherCategory;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [courses, lang, otherCategory]);

  const tableRows = useMemo(() => courses.map((course) => {
    const isEnrolled = enrolledIds.has(course.id);
    const price = Number(course.discountPrice ?? course.price ?? 0);
    return {
      id: course.id,
      title: localizedCourseTitle(course, lang),
      category: localizedCategoryName(course.category, lang) || '—',
      instructor: course.instructor?.fullName || '—',
      level: getLevelLabel(course.level) || course.level || '—',
      price: formatMoney(price),
      rating: Number(course.ratingAverage || 0).toFixed(1),
      lessons: course._count?.lessons || 0,
      enrolled: getEnrollmentLabel(isEnrolled),
      isEnrolled,
      isFree: price === 0,
      _raw: course,
    };
  }), [courses, enrolledIds, lang, getLevelLabel, getEnrollmentLabel]);

  const tableColumns = useMemo(() => [
    { key: 'title', header: t('student.browse.table.columns.title') },
    { key: 'category', header: t('student.browse.table.columns.category') },
    { key: 'instructor', header: t('student.browse.table.columns.instructor') },
    { key: 'level', header: t('student.browse.table.columns.level') },
    { key: 'price', header: t('student.browse.table.columns.price') },
    { key: 'rating', header: t('student.browse.table.columns.rating') },
    {
      key: 'enrolled',
      header: t('student.browse.table.columns.enrolled'),
      render: (row: typeof tableRows[number]) => (
        <Badge variant={row.isEnrolled ? 'success' : 'default'}>{row.enrolled}</Badge>
      ),
    },
    {
      key: 'actions',
      header: t('student.browse.table.columns.actions'),
      render: (row: typeof tableRows[number]) => (
        <Button
          size="sm"
          onClick={() => navigate(
            row.isEnrolled
              ? `/student/player/${row.id}`
              : `/student/courses/${row.id}`,
          )}
        >
          {getPrimaryActionLabel(row.isEnrolled, row.isFree)}
        </Button>
      ),
    },
  ], [t, lang, navigate, getPrimaryActionLabel]);

  const handleExport = () => {
    exportTableToExcel(
      t('student.browse.export.sheetName'),
      exportColumns,
      tableRows.map(({ _raw, isEnrolled, isFree, ...row }) => row),
    );
  };

  const selectCategory = (slug: string) => {
    const next = { ...filters, category: slug };
    setFilters(next);
    load(next);
  };

  return (
    <div className="page-grid student-courses-page">
      <div className="reports-header">
        <PageHeader
          title={t('student.browse.title')}
          subtitle={t('student.browse.subtitle')}
        />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!courses.length}>
            {t('student.browse.exportExcel')}
          </Button>
          <Button variant="outline" icon={<GraduationCap size={18} />} onClick={() => navigate('/student/my-courses')}>
            {t('student.browse.myCourses')}
          </Button>
        </div>
      </div>

      <Card className="student-courses-hero">
        <div className="student-courses-hero-icon">
          <Search size={32} />
        </div>
        <div className="student-courses-hero-body">
          <strong>{t('student.browse.heroTitle')}</strong>
          <p>
            {stats.total
              ? t('student.browse.heroSummary', {
                total: stats.total,
                free: stats.free,
                rating: stats.avgRating,
              })
              : t('student.browse.heroEmpty')}
          </p>
        </div>
      </Card>

      <div className="stats-grid">
        <StatCard title={t('student.browse.stats.displayed')} value={String(stats.total)} icon={BookOpen} />
        <StatCard title={t('student.browse.stats.free')} value={String(stats.free)} icon={Star} />
        <StatCard title={t('student.browse.stats.discounted')} value={String(stats.discounted)} icon={LayoutGrid} />
        <StatCard
          title={t('student.browse.stats.enrolled')}
          value={String(stats.enrolled)}
          icon={Users}
          hint={t('student.browse.stats.enrolledHint', { total: stats.total })}
        />
      </div>

      {categoryChart.length > 1 ? (
        <div className="reports-charts-grid student-courses-charts">
          <ReportChart title={t('student.browse.charts.categoryDistribution')} type="pie" data={categoryChart} />
        </div>
      ) : null}

      <FilterBar
        searchValue={filters.search || ''}
        searchPlaceholder={t('student.browse.filters.searchPlaceholder')}
        onSearchChange={(v) => updateFilter('search', v)}
        onReset={resetFilters}
        className="student-courses-filter"
      >
        <Select
          label={t('student.browse.filters.level')}
          value={filters.level || ''}
          onChange={(e) => updateFilter('level', e.target.value)}
          options={[
            { label: tc('status.all'), value: '' },
            { label: getLevelLabel('BEGINNER'), value: 'BEGINNER' },
            { label: getLevelLabel('INTERMEDIATE'), value: 'INTERMEDIATE' },
            { label: getLevelLabel('ADVANCED'), value: 'ADVANCED' },
          ]}
        />
        <Select
          label={t('student.browse.filters.type')}
          value={filters.type || ''}
          onChange={(e) => updateFilter('type', e.target.value)}
          options={[
            { label: tc('status.all'), value: '' },
            { label: typeLabels.RECORDED, value: 'RECORDED' },
            { label: typeLabels.LIVE, value: 'LIVE' },
            { label: typeLabels.MIXED, value: 'MIXED' },
          ]}
        />
        <Select
          label={t('student.browse.filters.price')}
          value={filters.price || ''}
          onChange={(e) => updateFilter('price', e.target.value)}
          options={[
            { label: tc('status.all'), value: '' },
            { label: t('student.browse.filters.priceFree'), value: 'free' },
            { label: t('student.browse.filters.pricePaid'), value: 'paid' },
            { label: t('student.browse.filters.priceDiscounted'), value: 'discounted' },
          ]}
        />
        <Select
          label={t('student.browse.filters.sort')}
          value={filters.sort || 'latest'}
          onChange={(e) => updateFilter('sort', e.target.value)}
          options={[
            { label: t('student.browse.filters.sortLatest'), value: 'latest' },
            { label: t('student.browse.filters.sortRating'), value: 'rating' },
            { label: t('student.browse.filters.sortPopular'), value: 'popular' },
            { label: t('student.browse.filters.sortPriceAsc'), value: 'price_asc' },
            { label: t('student.browse.filters.sortPriceDesc'), value: 'price_desc' },
          ]}
        />
        <Button onClick={applyFilters}>{t('student.browse.filters.apply')}</Button>
      </FilterBar>

      <div className="chip-row student-courses-categories">
        <button
          type="button"
          className={!filters.category ? 'chip active' : 'chip'}
          onClick={() => selectCategory('')}
        >
          {tc('status.all')}
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={filters.category === category.slug ? 'chip active' : 'chip'}
            onClick={() => selectCategory(category.slug)}
          >
            {localizedCategoryName(category, lang)}
            {category._count?.courses ? ` (${category._count.courses})` : ''}
          </button>
        ))}
      </div>

      <Tabs
        variant="pills"
        activeTab={viewMode}
        onChange={setViewMode}
        tabs={[
          { id: 'cards', label: t('student.browse.tabs.cards', { count: courses.length }) },
          { id: 'table', label: t('student.browse.tabs.table', { count: courses.length }) },
        ]}
      />

      {loading ? (
        <StudentCoursesGridSkeleton />
      ) : courses.length ? (
        viewMode === 'cards' ? (
          <div className="course-list-grid student-courses-grid">
            {courses.map((course, index) => {
              const isEnrolled = enrolledIds.has(course.id);
              return (
                <StudentCourseCard
                  key={course.id}
                  course={course}
                  isEnrolled={isEnrolled}
                  style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                  onPrimaryAction={() => navigate(
                    isEnrolled ? `/student/player/${course.id}` : `/student/courses/${course.id}`,
                  )}
                />
              );
            })}
          </div>
        ) : (
          <Card className="student-courses-table-wrap">
            <Table
              data={tableRows}
              emptyTitle={t('student.browse.table.emptyTitle')}
              emptyDescription={t('student.browse.table.emptyDescription')}
              columns={tableColumns}
            />
          </Card>
        )
      ) : (
        <Card>
          <EmptyState
            title={t('student.browse.empty.title')}
            description={t('student.browse.empty.description')}
            icon={BookOpen}
            actionLabel={t('student.browse.empty.reset')}
            onAction={resetFilters}
          />
        </Card>
      )}
    </div>
  );
}
