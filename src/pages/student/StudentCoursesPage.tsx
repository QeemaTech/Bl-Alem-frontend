import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Download, GraduationCap, LayoutGrid, Search, Star, Table2, Users,
} from 'lucide-react';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CourseCard } from '../../components/ui/CourseCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { CourseGridSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { ReportChart } from '../../components/reports/ReportChart';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { formatMoney } from '../../utils/formatMoney';
import { exportTableToExcel } from '../../utils/exportExcel';

const levelLabels: Record<string, string> = {
  BEGINNER: 'مبتدئ',
  INTERMEDIATE: 'متوسط',
  ADVANCED: 'متقدم',
};

const typeLabels: Record<string, string> = {
  RECORDED: 'مسجّلة',
  LIVE: 'مباشرة',
  MIXED: 'مختلطة',
};

const exportColumns = [
  { key: 'title', header: 'الدورة' },
  { key: 'category', header: 'التصنيف' },
  { key: 'instructor', header: 'المحاضر' },
  { key: 'level', header: 'المستوى' },
  { key: 'price', header: 'السعر' },
  { key: 'rating', header: 'التقييم' },
  { key: 'lessons', header: 'الدروس' },
  { key: 'enrolled', header: 'الحالة' },
];

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
      const name = c.category?.nameAr || 'أخرى';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [courses]);

  const tableRows = useMemo(() => courses.map((course) => ({
    id: course.id,
    title: course.titleAr,
    category: course.category?.nameAr || '—',
    instructor: course.instructor?.fullName || '—',
    level: levelLabels[course.level] || course.level || '—',
    price: formatMoney(Number(course.discountPrice ?? course.price ?? 0)),
    rating: Number(course.ratingAverage || 0).toFixed(1),
    lessons: course._count?.lessons || 0,
    enrolled: enrolledIds.has(course.id) ? 'مسجّل' : 'متاح',
    _raw: course,
  })), [courses, enrolledIds]);

  const handleExport = () => {
    exportTableToExcel('الكورسات-المتاحة', exportColumns, tableRows.map(({ _raw, ...row }) => row));
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
          title="الكورسات المتاحة"
          subtitle="اختر الدورة المناسبة لك وابدأ رحلة التعلم"
        />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!courses.length}>
            تصدير Excel
          </Button>
          <Button variant="outline" icon={<GraduationCap size={18} />} onClick={() => navigate('/student/my-courses')}>
            كورساتي
          </Button>
        </div>
      </div>

      <Card className="student-courses-hero">
        <div className="student-courses-hero-icon">
          <Search size={32} />
        </div>
        <div className="student-courses-hero-body">
          <strong>اكتشف دورات جديدة</strong>
          <p>
            {stats.total
              ? `${stats.total} دورة متاحة — ${stats.free} مجانية — متوسط التقييم ${stats.avgRating}`
              : 'استخدم الفلاتر للعثور على الدورة المناسبة.'}
          </p>
        </div>
      </Card>

      <div className="stats-grid">
        <StatCard title="الدورات المعروضة" value={String(stats.total)} icon={BookOpen} />
        <StatCard title="مجانية" value={String(stats.free)} icon={Star} />
        <StatCard title="عليها خصم" value={String(stats.discounted)} icon={LayoutGrid} />
        <StatCard title="مسجّل بها" value={String(stats.enrolled)} icon={Users} hint={`من ${stats.total}`} />
      </div>

      {categoryChart.length > 1 ? (
        <div className="reports-charts-grid student-courses-charts">
          <ReportChart title="توزيع التصنيفات" type="pie" data={categoryChart} />
        </div>
      ) : null}

      <FilterBar
        searchValue={filters.search || ''}
        searchPlaceholder="ابحث باسم الدورة أو المحاضر"
        onSearchChange={(v) => updateFilter('search', v)}
        onReset={resetFilters}
      >
        <Select
          label="المستوى"
          value={filters.level || ''}
          onChange={(e) => updateFilter('level', e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'مبتدئ', value: 'BEGINNER' },
            { label: 'متوسط', value: 'INTERMEDIATE' },
            { label: 'متقدم', value: 'ADVANCED' },
          ]}
        />
        <Select
          label="النوع"
          value={filters.type || ''}
          onChange={(e) => updateFilter('type', e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'مسجلة', value: 'RECORDED' },
            { label: 'مباشرة', value: 'LIVE' },
            { label: 'مختلطة', value: 'MIXED' },
          ]}
        />
        <Select
          label="السعر"
          value={filters.price || ''}
          onChange={(e) => updateFilter('price', e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'مجانية', value: 'free' },
            { label: 'مدفوعة', value: 'paid' },
            { label: 'عليها خصم', value: 'discounted' },
          ]}
        />
        <Select
          label="الترتيب"
          value={filters.sort || 'latest'}
          onChange={(e) => updateFilter('sort', e.target.value)}
          options={[
            { label: 'الأحدث', value: 'latest' },
            { label: 'الأعلى تقييماً', value: 'rating' },
            { label: 'الأكثر شعبية', value: 'popular' },
            { label: 'الأقل سعراً', value: 'price_asc' },
            { label: 'الأعلى سعراً', value: 'price_desc' },
          ]}
        />
        <Button onClick={applyFilters}>تطبيق</Button>
      </FilterBar>

      <div className="chip-row student-courses-categories">
        <button
          type="button"
          className={!filters.category ? 'chip active' : 'chip'}
          onClick={() => selectCategory('')}
        >
          الكل
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={filters.category === category.slug ? 'chip active' : 'chip'}
            onClick={() => selectCategory(category.slug)}
          >
            {category.nameAr}
            {category._count?.courses ? ` (${category._count.courses})` : ''}
          </button>
        ))}
      </div>

      <Tabs
        variant="pills"
        activeTab={viewMode}
        onChange={setViewMode}
        tabs={[
          { id: 'cards', label: `البطاقات (${courses.length})` },
          { id: 'table', label: `الجدول (${courses.length})` },
        ]}
      />

      {loading ? (
        <CourseGridSkeleton />
      ) : courses.length ? (
        viewMode === 'cards' ? (
          <div className="course-list-grid">
            {courses.map((course) => {
              const isEnrolled = enrolledIds.has(course.id);
              const price = Number(course.discountPrice ?? course.price ?? 0);
              return (
                <CourseCard
                  key={course.id}
                  title={course.titleAr}
                  category={course.category?.nameAr || 'دورة'}
                  instructor={course.instructor?.fullName}
                  imageUrl={course.coverImage}
                  price={price}
                  rating={Number(course.ratingAverage || 0)}
                  duration={`${course._count?.lessons || 0} دروس · ${levelLabels[course.level] || typeLabels[course.type] || ''}`}
                  status={isEnrolled ? 'مسجّل' : price === 0 ? 'مجاني' : undefined}
                  statusVariant={isEnrolled ? 'success' : 'info'}
                  actionLabel={isEnrolled ? 'استكمال' : 'عرض التفاصيل'}
                  onAction={() => navigate(isEnrolled ? `/student/player/${course.id}` : `/student/courses/${course.id}`)}
                />
              );
            })}
          </div>
        ) : (
          <Card>
            <Table
              data={tableRows}
              emptyTitle="لا توجد دورات"
              emptyDescription="جرّب تغيير الفلاتر."
              columns={[
                { key: 'title', header: 'الدورة' },
                { key: 'category', header: 'التصنيف' },
                { key: 'instructor', header: 'المحاضر' },
                { key: 'level', header: 'المستوى' },
                { key: 'price', header: 'السعر' },
                { key: 'rating', header: 'التقييم' },
                {
                  key: 'enrolled',
                  header: 'الحالة',
                  render: (row) => (
                    <Badge variant={row.enrolled === 'مسجّل' ? 'success' : 'default'}>{row.enrolled}</Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: 'الإجراءات',
                  render: (row) => (
                    <Button
                      size="sm"
                      onClick={() => navigate(
                        enrolledIds.has(row.id)
                          ? `/student/player/${row.id}`
                          : `/student/courses/${row.id}`,
                      )}
                    >
                      {enrolledIds.has(row.id) ? 'استكمال' : 'عرض'}
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        )
      ) : (
        <Card>
          <EmptyState
            title="لا توجد دورات"
            description="جرّب تغيير الفلاتر أو البحث بكلمة أخرى."
            icon={BookOpen}
            actionLabel="إعادة تعيين"
            onAction={resetFilters}
          />
        </Card>
      )}
    </div>
  );
}
