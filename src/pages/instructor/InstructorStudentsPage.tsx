import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { localizedCourseTitle } from '../../utils/localizedContent';
import { enrollmentVariant, fmtEnrollmentDate, getEnrollmentLabel } from './instructorStudentShared';

function CountBadge({ value, ariaLabel }: { value: string | number; ariaLabel: string }) {
  return <span className="admin-count-badge" aria-label={ariaLabel}>{value}</span>;
}

export default function InstructorStudentsPage() {
  const { t, i18n } = useTranslation('dashboard');
  const { t: tc } = useTranslation('common');
  const { t: tl } = useTranslation('liveSessions');
  const lang = i18n.language;
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const dash = tl('empty');

  const getStatusLabel = useCallback(
    (status: string) => getEnrollmentLabel(status),
    [lang],
  );

  const exportColumns = useMemo(() => {
    const cols = t('instructor.students.export.columns', { returnObjects: true }) as Record<string, string>;
    return [
      { key: 'student', header: cols.student },
      { key: 'email', header: cols.email },
      { key: 'course', header: cols.course },
      { key: 'enrolledAt', header: cols.enrolledAt },
      { key: 'progress', header: cols.progress },
      { key: 'status', header: cols.status },
    ];
  }, [t, lang]);

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
    if (statusFilter) {
      result = result.filter((s) => String(s.status) === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((s) =>
        [s.user?.fullName, s.user?.email, localizedCourseTitle(s.course, lang), getStatusLabel(s.status)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [students, statusFilter, search, lang, getStatusLabel]);

  const hasActiveFilters = Boolean(search.trim() || statusFilter || courseId);

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
      const title = localizedCourseTitle(s.course, lang) || dash;
      map.set(title, (map.get(title) || 0) + 1);
    });
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [students, lang]);

  const tableRows = useMemo(() => filteredStudents.map((row) => ({
    ...row,
    id: row.id,
  })), [filteredStudents]);

  const handleExport = () => {
    exportTableToExcel(t('instructor.students.export.sheetName'), exportColumns, filteredStudents.map((row) => ({
      student: row.user?.fullName || dash,
      email: row.user?.email || dash,
      course: localizedCourseTitle(row.course, lang) || dash,
      enrolledAt: fmtEnrollmentDate(row.enrolledAt, lang),
      progress: Number(row.progressPercentage || 0),
      status: getStatusLabel(row.status),
    })));
  };

  const handleCourseChange = (value: string) => {
    setCourseId(value);
    load(value);
  };

  const goToStudent = (userId: number | string) => navigate(`/instructor/students/${userId}`);

  const enrollmentOptions = useMemo(() => [
    { label: tc('status.all'), value: '' },
    { label: getEnrollmentLabel('ACTIVE'), value: 'ACTIVE' },
    { label: getEnrollmentLabel('COMPLETED'), value: 'COMPLETED' },
    { label: getEnrollmentLabel('CANCELLED'), value: 'CANCELLED' },
  ], [tc, lang]);

  return (
    <div className="page-grid admin-list-page instructor-students-page">
      <div className="admin-list-header">
        <PageHeader
          title={t('instructor.students.title')}
          subtitle={t('instructor.students.subtitle')}
        />
      </div>

      <div className="admin-list-stats stats-grid instructor-students-stats">
        <StatCard
          title={t('instructor.students.stats.totalEnrollments')}
          value={String(stats.total)}
          icon={BookOpen}
          tooltip={t('instructor.students.tooltips.totalEnrollments')}
        />
        <StatCard
          title={t('instructor.students.stats.uniqueStudents')}
          value={String(stats.uniqueStudents)}
          icon={Users}
          tooltip={t('instructor.students.tooltips.uniqueStudents')}
        />
        <StatCard title={t('instructor.students.stats.active')} value={String(stats.active)} icon={TrendingUp} />
        <StatCard
          title={t('instructor.students.stats.completed')}
          value={String(stats.completed)}
          icon={GraduationCap}
          hint={t('instructor.students.stats.avgProgressHint', { percent: stats.avgProgress })}
        />
      </div>

      {courseChart.length ? (
        <div className="admin-list-charts reports-charts-grid instructor-students-chart">
          <ReportChart
            title={t('instructor.students.chart.title')}
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
        searchPlaceholder={t('instructor.students.filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); handleCourseChange(''); }}
        resetDisabled={!hasActiveFilters}
        searchIconSize={20}
        extraActions={(
          <Button
            type="button"
            variant="outline"
            icon={<Download size={18} aria-hidden="true" />}
            onClick={handleExport}
            disabled={!filteredStudents.length}
          >
            {tl('actions.exportExcel')}
          </Button>
        )}
      >
        <Select
          label={t('instructor.students.filters.course')}
          value={courseId}
          onChange={(e) => handleCourseChange(e.target.value)}
          options={[
            { label: t('instructor.students.filters.allCourses'), value: '' },
            ...courses.map((c) => ({ label: localizedCourseTitle(c, lang), value: String(c.id) })),
          ]}
        />
        <Select
          label={t('instructor.students.filters.enrollmentStatus')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={enrollmentOptions}
        />
      </FilterBar>

      <Card className="admin-table-card instructor-students-table-card">
        <div className="section-heading instructor-students-table-head">
          <h2>{t('instructor.students.table.title')}</h2>
          <CountBadge
            value={
              hasActiveFilters
                ? `${filteredStudents.length}/${students.length}`
                : filteredStudents.length
            }
            ariaLabel={t('instructor.students.table.countAria', {
              value: hasActiveFilters
                ? `${filteredStudents.length}/${students.length}`
                : filteredStudents.length,
            })}
          />
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
            showHeadersWhenEmpty={hasActiveFilters}
            onRowClick={(row) => goToStudent((row.user as any)?.id)}
            emptyTitle={hasActiveFilters ? t('instructor.students.table.noResultsTitle') : t('instructor.students.table.emptyTitle')}
            columns={[
              {
                key: 'user',
                header: t('instructor.students.table.columns.student'),
                render: (row) => {
                  const name = String((row.user as any)?.fullName || dash);
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
                header: t('instructor.students.table.columns.course'),
                wrap: true,
                render: (row) => localizedCourseTitle((row.course as any), lang) || dash,
              },
              {
                key: 'enrolledAt',
                header: t('instructor.students.table.columns.enrolledAt'),
                align: 'center',
                hideOnMobile: true,
                render: (row) => fmtEnrollmentDate(String(row.enrolledAt), lang),
              },
              {
                key: 'progressPercentage',
                header: t('instructor.students.table.columns.progress'),
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
                header: t('instructor.students.table.columns.status'),
                align: 'center',
                render: (row) => (
                  <Badge variant={enrollmentVariant(String(row.status))}>
                    {getStatusLabel(String(row.status))}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: t('instructor.students.table.columns.actions'),
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
                    {t('instructor.students.table.details')}
                  </Button>
                ),
              },
            ]}
          />
        ) : hasActiveFilters ? (
          <div className="instructor-students-empty">
            <EmptyState
              title={t('instructor.students.table.noResultsTitle')}
              description={t('instructor.students.table.noResultsDesc')}
              icon={Users}
            />
          </div>
        ) : (
          <div className="instructor-students-empty">
            <EmptyState
              title={t('instructor.students.table.emptyTitle')}
              description={t('instructor.students.table.emptyDesc')}
              icon={Users}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
