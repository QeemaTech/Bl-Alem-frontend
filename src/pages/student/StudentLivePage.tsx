import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, Copy, Download, ExternalLink, Radio, UserRound, Video,
} from '@/icons';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { ReportChart } from '../../components/reports/ReportChart';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import {
  localizedCourseTitle,
  localizedSessionDescription,
  localizedSessionTitle,
} from '../../utils/localizedContent';
import { formatDateTime } from '../../utils/localeFormat';
import { exportTableToExcel } from '../../utils/exportExcel';

const statusVariant = (status: string) => {
  if (status === 'LIVE') return 'live' as const;
  if (status === 'SCHEDULED') return 'info' as const;
  if (status === 'ENDED') return 'completed' as const;
  if (status === 'CANCELLED') return 'rejected' as const;
  return 'default' as const;
};

export default function StudentLivePage() {
  const { t, i18n } = useTranslation('liveSessions');
  const lang = i18n.language;
  const { showToast } = useToast();
  const [tab, setTab] = useState('upcoming');
  const [viewMode, setViewMode] = useState('feed');
  const [data, setData] = useState<any>({ upcoming: [], liveNow: [], ended: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [selected, setSelected] = useState<any>(null);

  const getStatusLabel = useCallback(
    (status: string) => t(`labels.status.${status}`, { defaultValue: status }),
    [t, lang],
  );

  const fmtDate = useCallback(
    (value?: string) => (value
      ? formatDateTime(value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }, lang)
      : '—'),
    [lang],
  );

  const fmtDuration = useCallback(
    (minutes?: number) => t('durationMinutes', { count: minutes || 60 }),
    [t, lang],
  );

  const load = async () => {
    setLoading(true);
    try {
      setData(await studentApi.liveSessions());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: (data.upcoming?.length || 0) + (data.liveNow?.length || 0) + (data.ended?.length || 0),
    upcoming: data.upcoming?.length || 0,
    live: data.liveNow?.length || 0,
    ended: data.ended?.length || 0,
  }), [data]);

  const chartData = useMemo(() => [
    { label: t('student.charts.upcoming'), value: stats.upcoming },
    { label: t('student.charts.live'), value: stats.live },
    { label: t('student.charts.ended'), value: stats.ended },
  ].filter((item) => item.value > 0), [t, lang, stats]);

  const tabSessions = useMemo(() => {
    if (tab === 'liveNow') return data.liveNow || [];
    if (tab === 'ended') return data.ended || [];
    return data.upcoming || [];
  }, [data, tab]);

  const filtered = useMemo(() => {
    let result = [...tabSessions];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((s) =>
        [
          localizedSessionTitle(s, lang),
          localizedSessionDescription(s, lang),
          localizedCourseTitle(s.course, lang),
          s.instructor?.fullName,
          getStatusLabel(s.status),
        ].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [tabSessions, search, lang, getStatusLabel]);

  const exportColumns = useMemo(() => [
    { key: 'title', header: t('export.columns.title') },
    { key: 'course', header: t('export.columns.course') },
    { key: 'instructor', header: t('export.columns.instructor') },
    { key: 'startAt', header: t('export.columns.startAt') },
    { key: 'duration', header: t('export.columns.duration') },
    { key: 'status', header: t('export.columns.status') },
  ], [t, lang]);

  const tableRows = useMemo(() => filtered.map((session) => ({
    id: session.id,
    title: localizedSessionTitle(session, lang),
    course: localizedCourseTitle(session.course, lang),
    instructor: session.instructor?.fullName || '—',
    startAt: fmtDate(session.startAt),
    duration: session.durationMinutes,
    status: getStatusLabel(session.status),
    _raw: session,
  })), [filtered, fmtDate, getStatusLabel, lang]);

  const join = async (session: any) => {
    setJoiningId(session.id);
    try {
      const result = await studentApi.joinLiveSession(session.id);
      if (result.meetingUrl) {
        window.open(result.meetingUrl, '_blank', 'noopener,noreferrer');
        showToast(t('toast.linkOpened'), 'success');
      } else {
        showToast(t('toast.noMeetingUrl'), 'error');
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('toast.joinFailed');
      showToast(message, 'error');
    } finally {
      setJoiningId(null);
    }
  };

  const copyLink = async (url: string) => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    showToast(t('toast.linkCopied'), 'success');
  };

  const canJoin = (session: any) => session.status === 'LIVE' || session.status === 'SCHEDULED';

  const handleExport = () => {
    exportTableToExcel(
      t('student.export.sheetName'),
      exportColumns,
      tableRows.map(({ _raw, ...row }) => row),
    );
  };

  const tableColumns = useMemo(() => [
    { key: 'title', header: t('table.columns.title') },
    { key: 'course', header: t('table.columns.course') },
    { key: 'instructor', header: t('table.columns.instructor') },
    { key: 'startAt', header: t('table.columns.startAt') },
    { key: 'duration', header: t('table.columns.duration') },
    {
      key: 'status',
      header: t('table.columns.status'),
      render: (row: typeof tableRows[number]) => (
        <Badge variant={statusVariant(String(row._raw?.status))}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('table.columns.actions'),
      render: (row: typeof tableRows[number]) => (
        <div className="table-actions user-row-actions">
          <Button size="sm" variant="secondary" onClick={() => setSelected(row._raw)}>
            {t('actions.detail')}
          </Button>
          {canJoin(row._raw) ? (
            <Button
              size="sm"
              loading={joiningId === row._raw.id}
              onClick={() => join(row._raw)}
              icon={<Video size={14} />}
            >
              {t('actions.join')}
            </Button>
          ) : null}
        </div>
      ),
    },
  ], [t, lang, joiningId]);

  const renderSessionCard = (session: any) => (
    <article
      key={session.id}
      className={`live-session-item student-live-session-card ${session.status === 'LIVE' ? 'is-live' : ''}`}
    >
      <div className={`live-session-icon ${(session.status || 'scheduled').toLowerCase()}`}>
        {session.status === 'LIVE' ? <Radio size={22} /> : <Video size={22} />}
      </div>

      <div className="live-session-body">
        <div className="live-session-top">
          <div className="live-session-heading">
            <div className="live-session-title-row">
              <h3>{localizedSessionTitle(session, lang)}</h3>
              <Badge className="live-session-status" variant={statusVariant(session.status)}>
                {getStatusLabel(session.status)}
              </Badge>
            </div>
            <p className="live-session-course">{localizedCourseTitle(session.course, lang)}</p>
          </div>
        </div>

        <div className="live-session-meta">
          <span><UserRound size={14} /> {session.instructor?.fullName || '—'}</span>
          <span><Calendar size={14} /> {fmtDate(session.startAt)}</span>
          <span><Clock size={14} /> {fmtDuration(session.durationMinutes)}</span>
        </div>

        {localizedSessionDescription(session, lang) ? (
          <p className="live-session-desc">{localizedSessionDescription(session, lang)}</p>
        ) : null}
      </div>

      <div className="live-session-actions">
        <Button variant="ghost" size="sm" onClick={() => setSelected(session)}>
          {t('actions.detail')}
        </Button>
        {canJoin(session) ? (
          <Button
            size="sm"
            loading={joiningId === session.id}
            onClick={() => join(session)}
            icon={<Video size={14} />}
          >
            {t('actions.join')}
          </Button>
        ) : null}
      </div>
    </article>
  );

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-grid student-live-page">
      <div className="reports-header">
        <PageHeader
          title={t('student.title')}
          subtitle={t('student.subtitle')}
        />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!filtered.length}>
            {t('actions.exportExcel')}
          </Button>
        </div>
      </div>

      <Card className="student-live-hero">
        <div className="student-live-hero-icon">
          <Radio size={32} />
        </div>
        <div className="student-live-hero-body">
          <strong>{t('student.hero.title')}</strong>
          <p>
            {t('student.hero.body')}
            {stats.live ? t('student.hero.liveNow') : ''}
          </p>
        </div>
      </Card>

      <div className="stats-grid">
        <StatCard title={t('student.stats.total')} value={String(stats.total)} icon={Video} />
        <StatCard title={t('student.stats.upcoming')} value={String(stats.upcoming)} icon={Calendar} />
        <StatCard
          title={t('student.stats.live')}
          value={String(stats.live)}
          icon={Radio}
          hint={stats.live ? t('student.stats.liveHintActive') : t('student.stats.liveHintNone')}
        />
        <StatCard title={t('student.stats.ended')} value={String(stats.ended)} icon={Clock} />
      </div>

      {chartData.length ? (
        <div className="reports-charts-grid student-live-charts">
          <ReportChart title={t('student.charts.distribution')} type="pie" data={chartData} />
        </div>
      ) : null}

      <Tabs
        variant="pills"
        activeTab={tab}
        onChange={setTab}
        tabs={[
          { id: 'upcoming', label: t('student.tabs.upcoming', { count: stats.upcoming }) },
          { id: 'liveNow', label: t('student.tabs.liveNow', { count: stats.live }) },
          { id: 'ended', label: t('student.tabs.ended', { count: stats.ended }) },
        ]}
      />

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('student.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => setSearch('')}
      />

      <Tabs
        variant="pills"
        activeTab={viewMode}
        onChange={setViewMode}
        tabs={[
          { id: 'feed', label: t('student.view.feed') },
          { id: 'table', label: t('student.view.table') },
        ]}
      />

      {viewMode === 'feed' ? (
        filtered.length ? (
          <div className="live-sessions-feed">
            {filtered.map(renderSessionCard)}
          </div>
        ) : (
          <Card>
            <EmptyState
              title={t('student.empty.title')}
              description={
                stats.total
                  ? t('student.empty.filteredInTab')
                  : t('student.empty.noSessions')
              }
              icon={Video}
              actionLabel={stats.total ? undefined : t('student.myCoursesAction')}
              onAction={stats.total ? undefined : () => { window.location.href = '/student/my-courses'; }}
            />
          </Card>
        )
      ) : (
        <Card>
          <Table
            data={tableRows}
            emptyTitle={t('student.empty.title')}
            emptyDescription={t('student.empty.tableDescription')}
            columns={tableColumns}
          />
        </Card>
      )}

      <Modal
        isOpen={Boolean(selected)}
        title={selected ? localizedSessionTitle(selected, lang) : t('detail.title')}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="student-live-detail stack-sm">
            <div className="student-live-detail-meta">
              <Badge variant={statusVariant(selected.status)}>
                {getStatusLabel(selected.status)}
              </Badge>
              <span><Calendar size={14} /> {fmtDate(selected.startAt)}</span>
              <span><Clock size={14} /> {fmtDuration(selected.durationMinutes)}</span>
            </div>
            <div className="student-live-detail-row">
              <strong>{t('detail.fields.course')}</strong>
              <span>{localizedCourseTitle(selected.course, lang)}</span>
            </div>
            <div className="student-live-detail-row">
              <strong>{t('detail.fields.instructor')}</strong>
              <span>{selected.instructor?.fullName || '—'}</span>
            </div>
            {localizedSessionDescription(selected, lang) ? (
              <div className="student-live-detail-row block">
                <strong>{t('detail.fields.description')}</strong>
                <p>{localizedSessionDescription(selected, lang)}</p>
              </div>
            ) : null}
            {selected.meetingUrl && canJoin(selected) ? (
              <div className="live-session-link">
                <a href={selected.meetingUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} />
                  {t('student.detail.openMeetingLink')}
                </a>
                <Button variant="ghost" size="sm" onClick={() => copyLink(selected.meetingUrl)}>
                  <Copy size={14} />
                </Button>
              </div>
            ) : null}
            <div className="card-actions">
              {canJoin(selected) ? (
                <Button loading={joiningId === selected.id} onClick={() => join(selected)} icon={<Video size={16} />}>
                  {t('actions.joinSession')}
                </Button>
              ) : null}
              <Link to={`/student/courses/${selected.courseId}`}>
                <Button variant="outline">{t('student.detail.viewCourse')}</Button>
              </Link>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
