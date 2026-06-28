import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import {
  localizedCourseTitle,
  localizedPathDescription,
  localizedPathTitle,
} from '../../utils/localizedContent';
import { exportTableToExcel } from '../../utils/exportExcel';

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

export default function StudentLearningPathsPage() {
  const { t, i18n } = useTranslation('learningPaths');
  const { t: tc } = useTranslation('common');
  const lang = i18n.language;
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

  const pathStatusLabel = (status: string) => {
    if (status === 'completed') return t('student.labels.status.completed');
    if (status === 'in_progress') return t('student.labels.status.inProgress');
    return t('student.labels.status.notStarted');
  };

  const pathStatusVariant = (status: string) => {
    if (status === 'completed') return 'success' as const;
    if (status === 'in_progress') return 'info' as const;
    return 'default' as const;
  };

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

  const exportColumns = useMemo(() => [
    { key: 'title', header: t('student.list.export.columns.title') },
    { key: 'courses', header: t('student.list.export.columns.courses') },
    { key: 'enrolled', header: t('student.list.export.columns.enrolled') },
    { key: 'completed', header: t('student.list.export.columns.completed') },
    { key: 'progress', header: t('student.list.export.columns.progress') },
    { key: 'status', header: t('student.list.export.columns.status') },
  ], [t, lang]);

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
    { label: t('student.list.charts.completed'), value: listStats.completed },
    { label: t('student.list.charts.inProgress'), value: listStats.started },
    { label: t('student.list.charts.notStarted'), value: Math.max(0, listStats.paths - listStats.completed - listStats.started) },
  ].filter((d) => d.value > 0), [listStats, t, lang]);

  const filteredPaths = useMemo(() => {
    let result = paths.map((p) => ({ ...p, stats: getPathStats(p, enrollmentMap) }));
    if (statusFilter) result = result.filter((p) => p.stats.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) =>
        [
          p.titleAr,
          p.titleEn,
          p.descriptionAr,
          p.descriptionEn,
        ].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [paths, enrollmentMap, search, statusFilter]);

  const tableRows = useMemo(() => filteredPaths.map((p) => ({
    id: p.id,
    title: localizedPathTitle(p, lang),
    courses: p.stats.total,
    enrolled: p.stats.enrolled,
    completed: p.stats.completed,
    progress: p.stats.progress,
    status: pathStatusLabel(p.stats.status),
    statusKey: p.stats.status,
    _raw: p,
  })), [filteredPaths, lang, t]);

  const tableColumns = useMemo(() => [
    { key: 'title', header: t('student.list.table.columns.title') },
    { key: 'courses', header: t('student.list.table.columns.courses') },
    { key: 'enrolled', header: t('student.list.table.columns.enrolled') },
    { key: 'completed', header: t('student.list.table.columns.completed') },
    {
      key: 'progress',
      header: t('student.list.table.columns.progress'),
      render: (row: typeof tableRows[number]) => `${row.progress}%`,
    },
    {
      key: 'status',
      header: t('student.list.table.columns.status'),
      render: (row: typeof tableRows[number]) => (
        <Badge variant={pathStatusVariant(row.statusKey)}>{row.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: t('student.list.table.columns.actions'),
      render: (row: typeof tableRows[number]) => (
        <Button size="sm" onClick={() => navigate(`/student/learning-paths/${row.id}`)}>
          {t('student.labels.actions.view')}
        </Button>
      ),
    },
  ], [t, lang, navigate]);

  const handleExport = () => {
    exportTableToExcel(
      t('student.list.export.sheetName'),
      exportColumns,
      tableRows.map(({ _raw, statusKey, ...row }) => row),
    );
  };

  const renderPathCard = (item: any) => {
    const s = item.stats || getPathStats(item, enrollmentMap);
    return (
      <Card key={item.id} className="learning-path-card student-learning-path-card">
        <div className="learning-path-top">
          <span className="learning-path-icon"><Route size={22} /></span>
          <span className="learning-path-count">{t('student.labels.coursesCount', { count: s.total })}</span>
        </div>
        <Badge variant={pathStatusVariant(s.status)}>{pathStatusLabel(s.status)}</Badge>
        <h3>{localizedPathTitle(item, lang)}</h3>
        <p>{localizedPathDescription(item, lang, t('student.labels.defaultDesc'))}</p>
        {s.enrolled > 0 ? (
          <ProgressBar value={s.progress} label={t('student.labels.pathProgress')} size="sm" />
        ) : null}
        <div className="student-learning-path-meta">
          <span>{t('student.labels.enrolledShort', { count: s.enrolled })}</span>
          <span>{t('student.labels.completedShort', { count: s.completed })}</span>
        </div>
        <Link to={`/student/learning-paths/${item.id}`} className="learning-path-action">
          <Button size="sm" fullWidth variant={s.status === 'completed' ? 'secondary' : 'primary'}>
            {s.status === 'completed'
              ? t('student.labels.actions.reviewPath')
              : t('student.labels.actions.explore')}
          </Button>
        </Link>
      </Card>
    );
  };

  if (loading) return <DashboardSkeleton />;

  if (id && path) {
    const pathStats = getPathStats(path, enrollmentMap);
    const courses = path.courses || [];
    const pathTitle = localizedPathTitle(path, lang);
    const pathDescription = localizedPathDescription(path, lang, t('student.labels.defaultDesc'));

    const enrollAll = async () => {
      setEnrolling(true);
      try {
        await studentApi.enrollLearningPath(path.id, { gateway: 'SIMULATED' });
        showToast(t('student.detail.toast.enrollSuccess'), 'success');
        const [updatedPath, updatedEnrollments] = await Promise.all([
          studentApi.learningPath(path.id),
          studentApi.myCourses('all'),
        ]);
        setPath(updatedPath);
        setEnrollments(updatedEnrollments);
      } catch {
        showToast(t('student.detail.toast.enrollError'), 'error');
      } finally {
        setEnrolling(false);
      }
    };

    const journeyMessage = pathStats.completed === pathStats.total && pathStats.total > 0
      ? t('student.detail.journey.allComplete')
      : pathStats.enrolled > 0
        ? t('student.detail.journey.partial', {
          completed: pathStats.completed,
          total: pathStats.total,
        })
        : t('student.detail.journey.notStarted');

    return (
      <div className="page-grid student-learning-path-detail">
        <div className="reports-header student-learning-path-detail-header">
          <PageHeader
            title={pathTitle}
            subtitle={pathDescription}
            breadcrumb={[
              { label: t('student.detail.breadcrumb'), to: '/student/learning-paths' },
              { label: pathTitle },
            ]}
          />
          <div className="reports-header-actions">
            <Link to="/student/learning-paths">
              <Button variant="outline" size="sm" icon={<ArrowRight size={16} />}>
                {t('student.labels.actions.backToPaths')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="stats-grid student-learning-path-detail-stats">
          <StatCard title={t('student.detail.stats.pathCourses')} value={String(pathStats.total)} icon={BookOpen} />
          <StatCard title={t('student.detail.stats.enrolled')} value={String(pathStats.enrolled)} icon={PlayCircle} />
          <StatCard title={t('student.detail.stats.completed')} value={String(pathStats.completed)} icon={CheckCircle2} />
          <StatCard title={t('student.detail.stats.progress')} value={`${pathStats.progress}%`} icon={Target} />
        </div>

        <div className="student-learning-path-detail-insights">
          <Card className="student-path-journey-card">
            <div className="student-path-journey-head">
              <span className="student-path-journey-icon"><Route size={22} /></span>
              <div className="student-path-journey-copy">
                <strong>{t('student.detail.journey.title')}</strong>
                <p>{journeyMessage}</p>
              </div>
              <span className="student-path-journey-percent">{pathStats.progress}%</span>
            </div>
            <ProgressBar value={pathStats.progress} label={t('student.labels.completionRate')} size="md" />
            {pathStats.total ? (
              <p className="student-path-journey-foot">
                {t('student.labels.enrolledShort', { count: pathStats.enrolled })}
                {' · '}
                {t('student.labels.completedShort', { count: pathStats.completed })}
                {' · '}
                {t('student.labels.totalShort', { count: pathStats.total })}
              </p>
            ) : null}
          </Card>

          {pathStats.enrolled < pathStats.total ? (
            <Card className="student-path-enroll-card">
              <div className="student-path-enroll-icon" aria-hidden>
                <GraduationCap size={26} />
              </div>
              <div className="student-path-enroll-copy">
                <strong>{t('student.detail.enroll.title')}</strong>
                <p>{t('student.detail.enroll.desc')}</p>
              </div>
              <Button
                loading={enrolling}
                onClick={enrollAll}
                icon={<GraduationCap size={16} />}
                className="student-path-enroll-btn"
              >
                {t('student.labels.actions.enrollNow')}
              </Button>
            </Card>
          ) : null}
        </div>

        <Card className="student-path-timeline">
          <div className="section-heading student-path-timeline-heading">
            <h2><Route size={18} /> {t('student.detail.timeline.title')}</h2>
            <span className="muted-count">{t('student.labels.stepsCount', { count: courses.length })}</span>
          </div>
          <div className="student-path-steps">
            {courses.map((item: any, index: number) => {
              const enrollment = enrollmentMap.get(item.courseId);
              const done = enrollment && (enrollment.status === 'COMPLETED' || enrollment.progressPercentage >= 100);
              const enrolled = Boolean(enrollment);
              const stepStatusKey = done ? 'completed' : enrolled ? 'inProgress' : 'notEnrolled';
              return (
                <div
                  key={item.id}
                  className={`student-path-step ${done ? 'done' : enrolled ? 'active' : ''}`}
                >
                  <span className="student-path-step-num" aria-hidden>
                    {done ? <CheckCircle2 size={18} /> : index + 1}
                  </span>
                  <div className="student-path-step-body">
                    <strong>{localizedCourseTitle(item.course, lang)}</strong>
                    <span><UserRound size={12} /> {item.course?.instructor?.fullName || '—'}</span>
                    {enrolled ? (
                      <ProgressBar value={enrollment?.progressPercentage || 0} size="sm" />
                    ) : null}
                  </div>
                  <Badge variant={pathStatusVariant(done ? 'completed' : enrolled ? 'in_progress' : 'not_started')}>
                    {t(`student.labels.status.${stepStatusKey}`)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <section className="student-learning-path-courses-section">
          <div className="section-heading student-learning-path-courses-heading">
            <h2><BookOpen size={18} /> {t('student.detail.coursesSection.title')}</h2>
            <span className="muted-count">{t('student.labels.coursesInPath', { count: courses.length })}</span>
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
          title={t('student.list.title')}
          subtitle={t('student.list.subtitle')}
        />
        <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!filteredPaths.length}>
          {t('student.list.exportExcel')}
        </Button>
      </div>

      <Card className="student-learning-paths-hero">
        <div className="student-learning-paths-hero-icon">
          <GraduationCap size={32} />
        </div>
        <div className="student-learning-paths-hero-body">
          <strong>{t('student.list.heroTitle')}</strong>
          <p>
            {listStats.paths
              ? t('student.list.heroSummary', {
                paths: listStats.paths,
                courses: listStats.totalCourses,
              })
              : t('student.list.heroEmpty')}
          </p>
        </div>
      </Card>

      <div className="stats-grid">
        <StatCard title={t('student.list.stats.paths')} value={String(listStats.paths)} icon={Route} />
        <StatCard title={t('student.list.stats.inProgress')} value={String(listStats.started)} icon={PlayCircle} />
        <StatCard title={t('student.list.stats.completed')} value={String(listStats.completed)} icon={CheckCircle2} />
        <StatCard title={t('student.list.stats.totalCourses')} value={String(listStats.totalCourses)} icon={BookOpen} />
      </div>

      {chartData.length ? (
        <div className="reports-charts-grid student-learning-paths-charts">
          <ReportChart title={t('student.list.charts.statusDistribution')} type="pie" data={chartData} />
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('student.list.filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label={t('student.list.filters.status')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: tc('status.all'), value: '' },
            { label: t('student.labels.status.notStarted'), value: 'not_started' },
            { label: t('student.labels.status.inProgress'), value: 'in_progress' },
            { label: t('student.labels.status.completed'), value: 'completed' },
          ]}
        />
      </FilterBar>

      <Tabs
        variant="pills"
        activeTab={viewMode}
        onChange={setViewMode}
        tabs={[
          { id: 'cards', label: t('student.list.tabs.cards', { count: filteredPaths.length }) },
          { id: 'table', label: t('student.list.tabs.table', { count: filteredPaths.length }) },
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
              title={t('student.list.empty.title')}
              description={paths.length
                ? t('student.list.empty.filteredDesc')
                : t('student.list.empty.defaultDesc')}
              icon={Route}
            />
          </Card>
        )
      ) : (
        <Card>
          <Table
            data={tableRows}
            emptyTitle={t('student.list.table.emptyTitle')}
            emptyDescription={t('student.list.table.emptyDescription')}
            columns={tableColumns}
          />
        </Card>
      )}
    </div>
  );
}
