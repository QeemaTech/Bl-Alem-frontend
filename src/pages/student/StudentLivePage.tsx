import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, Copy, Download, ExternalLink, Radio, UserRound, Video,
} from 'lucide-react';
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
import { exportTableToExcel } from '../../utils/exportExcel';

const statusLabels: Record<string, string> = {
  SCHEDULED: 'مجدولة',
  LIVE: 'مباشر الآن',
  ENDED: 'منتهية',
  CANCELLED: 'ملغاة',
};

const statusVariant = (status: string) => {
  if (status === 'LIVE') return 'live' as const;
  if (status === 'SCHEDULED') return 'info' as const;
  if (status === 'ENDED') return 'completed' as const;
  if (status === 'CANCELLED') return 'rejected' as const;
  return 'default' as const;
};

const fmtDate = (value?: string) => (value
  ? new Date(value).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  : '—');

const exportColumns = [
  { key: 'title', header: 'العنوان' },
  { key: 'course', header: 'الكورس' },
  { key: 'instructor', header: 'المحاضر' },
  { key: 'startAt', header: 'موعد البدء' },
  { key: 'duration', header: 'المدة (دقيقة)' },
  { key: 'status', header: 'الحالة' },
];

export default function StudentLivePage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('upcoming');
  const [viewMode, setViewMode] = useState('feed');
  const [data, setData] = useState<any>({ upcoming: [], liveNow: [], ended: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [selected, setSelected] = useState<any>(null);

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
    { label: 'قادمة', value: stats.upcoming },
    { label: 'مباشر', value: stats.live },
    { label: 'سابقة', value: stats.ended },
  ].filter((item) => item.value > 0), [stats]);

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
        [s.titleAr, s.descriptionAr, s.course?.titleAr, s.instructor?.fullName, statusLabels[s.status]]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [tabSessions, search]);

  const tableRows = useMemo(() => filtered.map((session) => ({
    id: session.id,
    title: session.titleAr,
    course: session.course?.titleAr || '—',
    instructor: session.instructor?.fullName || '—',
    startAt: fmtDate(session.startAt),
    duration: session.durationMinutes,
    status: statusLabels[session.status] || session.status,
    _raw: session,
  })), [filtered]);

  const join = async (session: any) => {
    setJoiningId(session.id);
    try {
      const result = await studentApi.joinLiveSession(session.id);
      if (result.meetingUrl) {
        window.open(result.meetingUrl, '_blank', 'noopener,noreferrer');
        showToast('تم فتح رابط الجلسة.', 'success');
      } else {
        showToast('لا يوجد رابط اجتماع متاح.', 'error');
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || 'تعذّر الانضمام للجلسة.';
      showToast(message, 'error');
    } finally {
      setJoiningId(null);
    }
  };

  const copyLink = async (url: string) => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    showToast('تم نسخ رابط الاجتماع.', 'success');
  };

  const canJoin = (session: any) => session.status === 'LIVE' || session.status === 'SCHEDULED';

  const handleExport = () => {
    exportTableToExcel('جلسات-الطالب', exportColumns, tableRows.map(({ _raw, ...row }) => row));
  };

  const renderSessionCard = (session: any) => (
    <article
      key={session.id}
      className={`live-session-item ${session.status === 'LIVE' ? 'is-live' : ''}`}
    >
      <div className={`live-session-icon ${(session.status || 'scheduled').toLowerCase()}`}>
        {session.status === 'LIVE' ? <Radio size={22} /> : <Video size={22} />}
      </div>

      <div className="live-session-body">
        <div className="live-session-top">
          <div>
            <h3>{session.titleAr}</h3>
            <p className="live-session-course">{session.course?.titleAr || '—'}</p>
          </div>
          <Badge variant={statusVariant(session.status)}>
            {statusLabels[session.status] || session.status}
          </Badge>
        </div>

        <div className="live-session-meta">
          <span><UserRound size={14} /> {session.instructor?.fullName || '—'}</span>
          <span><Calendar size={14} /> {fmtDate(session.startAt)}</span>
          <span><Clock size={14} /> {session.durationMinutes || 60} دقيقة</span>
        </div>

        {session.descriptionAr ? (
          <p className="live-session-desc">{session.descriptionAr}</p>
        ) : null}
      </div>

      <div className="live-session-actions">
        <Button variant="ghost" size="sm" onClick={() => setSelected(session)}>
          التفاصيل
        </Button>
        {canJoin(session) ? (
          <Button
            size="sm"
            loading={joiningId === session.id}
            onClick={() => join(session)}
            icon={<Video size={14} />}
          >
            انضمام
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
          title="الجلسات المباشرة"
          subtitle="انضم للجلسات القادمة أو شاهد السجل السابق"
        />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!filtered.length}>
            تصدير Excel
          </Button>
        </div>
      </div>

      <Card className="student-live-hero">
        <div className="student-live-hero-icon">
          <Radio size={32} />
        </div>
        <div className="student-live-hero-body">
          <strong>جلسات دوراتك المسجّلة</strong>
          <p>
            تظهر هنا الجلسات المباشرة للكورسات التي اشتركت بها.
            {stats.live ? ' يوجد جلسة مباشرة الآن — انضم فوراً!' : ''}
          </p>
        </div>
      </Card>

      <div className="stats-grid">
        <StatCard title="إجمالي الجلسات" value={String(stats.total)} icon={Video} />
        <StatCard title="قادمة" value={String(stats.upcoming)} icon={Calendar} />
        <StatCard
          title="مباشر الآن"
          value={String(stats.live)}
          icon={Radio}
          hint={stats.live ? 'جلسة نشطة' : 'لا جلسة حية'}
        />
        <StatCard title="سابقة" value={String(stats.ended)} icon={Clock} />
      </div>

      {chartData.length ? (
        <div className="reports-charts-grid student-live-charts">
          <ReportChart title="توزيع الجلسات" type="pie" data={chartData} />
        </div>
      ) : null}

      <Tabs
        variant="pills"
        activeTab={tab}
        onChange={setTab}
        tabs={[
          { id: 'upcoming', label: `القادمة (${stats.upcoming})` },
          { id: 'liveNow', label: `مباشر الآن (${stats.live})` },
          { id: 'ended', label: `السابقة (${stats.ended})` },
        ]}
      />

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالعنوان، الكورس، أو المحاضر..."
        onSearchChange={setSearch}
        onReset={() => setSearch('')}
      />

      <Tabs
        variant="pills"
        activeTab={viewMode}
        onChange={setViewMode}
        tabs={[
          { id: 'feed', label: 'البطاقات' },
          { id: 'table', label: 'الجدول' },
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
              title="لا توجد جلسات"
              description={
                stats.total
                  ? 'لا توجد جلسات مطابقة في هذا التصنيف.'
                  : 'لا توجد جلسات مباشرة لدوراتك حالياً. اشترك في دورة تحتوي على جلسات مباشرة.'
              }
              icon={Video}
              actionLabel={stats.total ? undefined : 'كورساتي'}
              onAction={stats.total ? undefined : () => { window.location.href = '/student/my-courses'; }}
            />
          </Card>
        )
      ) : (
        <Card>
          <Table
            data={tableRows}
            emptyTitle="لا توجد جلسات"
            emptyDescription="لا توجد جلسات مطابقة للبحث أو التصنيف الحالي."
            columns={[
              { key: 'title', header: 'العنوان' },
              { key: 'course', header: 'الكورس' },
              { key: 'instructor', header: 'المحاضر' },
              { key: 'startAt', header: 'الموعد' },
              { key: 'duration', header: 'المدة' },
              {
                key: 'status',
                header: 'الحالة',
                render: (row) => (
                  <Badge variant={statusVariant(String(row._raw?.status))}>
                    {row.status}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'الإجراءات',
                render: (row) => (
                  <div className="table-actions">
                    <Button size="sm" variant="secondary" onClick={() => setSelected(row._raw)}>
                      التفاصيل
                    </Button>
                    {canJoin(row._raw) ? (
                      <Button
                        size="sm"
                        loading={joiningId === row._raw.id}
                        onClick={() => join(row._raw)}
                        icon={<Video size={14} />}
                      >
                        انضمام
                      </Button>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      <Modal
        isOpen={Boolean(selected)}
        title={selected?.titleAr || 'تفاصيل الجلسة'}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="student-live-detail stack-sm">
            <div className="student-live-detail-meta">
              <Badge variant={statusVariant(selected.status)}>
                {statusLabels[selected.status] || selected.status}
              </Badge>
              <span><Calendar size={14} /> {fmtDate(selected.startAt)}</span>
              <span><Clock size={14} /> {selected.durationMinutes || 60} دقيقة</span>
            </div>
            <div className="student-live-detail-row">
              <strong>الكورس</strong>
              <span>{selected.course?.titleAr || '—'}</span>
            </div>
            <div className="student-live-detail-row">
              <strong>المحاضر</strong>
              <span>{selected.instructor?.fullName || '—'}</span>
            </div>
            {selected.descriptionAr ? (
              <div className="student-live-detail-row block">
                <strong>الوصف</strong>
                <p>{selected.descriptionAr}</p>
              </div>
            ) : null}
            {selected.meetingUrl && canJoin(selected) ? (
              <div className="live-session-link">
                <a href={selected.meetingUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} />
                  فتح رابط الاجتماع
                </a>
                <Button variant="ghost" size="sm" onClick={() => copyLink(selected.meetingUrl)}>
                  <Copy size={14} />
                </Button>
              </div>
            ) : null}
            <div className="card-actions">
              {canJoin(selected) ? (
                <Button loading={joiningId === selected.id} onClick={() => join(selected)} icon={<Video size={16} />}>
                  انضمام للجلسة
                </Button>
              ) : null}
              <Link to={`/student/courses/${selected.courseId}`}>
                <Button variant="outline">عرض الدورة</Button>
              </Link>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
