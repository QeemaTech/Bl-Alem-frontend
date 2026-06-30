import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Radio, Video, Calendar, Clock } from '@/icons';
import { adminApi } from '../../api/admin';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterBar } from '../../components/ui/FilterBar';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { useAdminLiveSessionLabels } from '../../hooks/useAdminLiveSessionLabels';
import { exportTableToExcel } from '../../utils/exportExcel';

const toLocalInput = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const emptyForm = {
  titleAr: '',
  descriptionAr: '',
  startAt: '',
  durationMinutes: '60',
  meetingUrl: '',
  status: 'SCHEDULED',
};

export default function AdminLiveSessionsPage() {
  const { t } = useTranslation(['liveSessions', 'common']);
  const { showToast } = useToast();
  const {
    statusLabels,
    fmtDate,
    fmtDurationShort,
    fmtDurationMinutes,
    statusVariant,
    empty,
  } = useAdminLiveSessionLabels();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [cancelTarget, setCancelTarget] = useState<any>(null);

  const exportColumns = useMemo(() => {
    const cols = t('export.columns', { returnObjects: true }) as Record<string, string>;
    return [
      { key: 'id', header: cols.id },
      { key: 'title', header: cols.title },
      { key: 'course', header: cols.course },
      { key: 'instructor', header: cols.instructor },
      { key: 'startAt', header: cols.startAt },
      { key: 'duration', header: cols.duration },
      { key: 'meetingUrl', header: cols.meetingUrl },
      { key: 'status', header: cols.status },
    ];
  }, [t]);

  const load = async () => {
    setLoading(true);
    setItems(await adminApi.liveSessions());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [
          i.titleAr,
          i.descriptionAr,
          i.course?.titleAr,
          i.instructor?.fullName,
          i.instructor?.email,
          String(i.id),
        ].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, statusFilter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    scheduled: items.filter((i) => i.status === 'SCHEDULED').length,
    live: items.filter((i) => i.status === 'LIVE').length,
    ended: items.filter((i) => i.status === 'ENDED').length,
    cancelled: items.filter((i) => i.status === 'CANCELLED').length,
  }), [items]);

  const statusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const key = i.status;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      label: statusLabels[key] || key,
      value,
    }));
  }, [items, statusLabels]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    title: row.titleAr,
    course: row.course?.titleAr || empty,
    instructor: row.instructor?.fullName || empty,
    startAt: fmtDate(row.startAt),
    duration: fmtDurationShort(row.durationMinutes),
    meetingUrl: row.meetingUrl || empty,
    status: statusLabels[row.status] || row.status,
    _raw: row,
  })), [filteredItems, statusLabels, fmtDate, fmtDurationShort, empty]);

  const statusFilterOptions = useMemo(() => [
    { label: t('filters.allStatuses'), value: '' },
    { label: statusLabels.SCHEDULED, value: 'SCHEDULED' },
    { label: statusLabels.LIVE, value: 'LIVE' },
    { label: statusLabels.ENDED, value: 'ENDED' },
    { label: statusLabels.CANCELLED, value: 'CANCELLED' },
  ], [t, statusLabels]);

  const formStatusOptions = useMemo(() => [
    { label: statusLabels.SCHEDULED, value: 'SCHEDULED' },
    { label: statusLabels.LIVE, value: 'LIVE' },
    { label: statusLabels.ENDED, value: 'ENDED' },
    { label: statusLabels.CANCELLED, value: 'CANCELLED' },
  ], [statusLabels]);

  const detailFields = t('detail.fields', { returnObjects: true }) as Record<string, string>;
  const tableCols = t('table.columns', { returnObjects: true }) as Record<string, string>;

  const openDetail = (session: any) => {
    setSelected(session);
    setDetailOpen(true);
  };

  const openEdit = (session: any) => {
    setSelected(session);
    setForm({
      titleAr: session.titleAr,
      descriptionAr: session.descriptionAr || '',
      startAt: toLocalInput(session.startAt),
      durationMinutes: String(session.durationMinutes ?? 60),
      meetingUrl: session.meetingUrl || '',
      status: session.status,
    });
    setEditOpen(true);
  };

  const saveSession = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      await adminApi.updateLiveSession(selected.id, {
        titleAr: form.titleAr.trim(),
        descriptionAr: form.descriptionAr.trim() || null,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
        durationMinutes: Number(form.durationMinutes),
        meetingUrl: form.meetingUrl.trim() || null,
        status: form.status,
      });
      showToast(t('toast.updated'), 'success');
      setEditOpen(false);
      setSelected(null);
      setForm(emptyForm);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const setStatus = async (session: any, status: string, message: string) => {
    await adminApi.updateLiveSession(session.id, { status });
    showToast(message, 'success');
    await load();
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    await adminApi.cancelLiveSession(cancelTarget.id);
    showToast(t('toast.cancelled'), 'success');
    setCancelTarget(null);
    setDetailOpen(false);
    setSelected(null);
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await adminApi.deleteLiveSession(deleteTarget.id);
    showToast(t('toast.deleted'), 'success');
    setDeleteTarget(null);
    await load();
  };

  const handleExport = () => {
    exportTableToExcel(
      t('export.sheetName'),
      exportColumns,
      tableRows.map(({ _raw, ...row }) => row),
    );
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            {t('actions.exportExcel')}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('stats.total')} value={String(stats.total)} icon={Video} />
        <StatCard title={t('stats.scheduled')} value={String(stats.scheduled)} icon={Calendar} />
        <StatCard title={t('stats.live')} value={String(stats.live)} icon={Radio} />
        <StatCard title={t('stats.ended')} value={String(stats.ended)} icon={Clock} />
        <StatCard title={t('stats.cancelled')} value={String(stats.cancelled)} icon={Video} />
      </div>

      <div className="reports-charts-grid">
        <ReportChart title={t('charts.statusDistribution')} type="pie" data={statusChart} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label={t('filters.status')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusFilterOptions}
        />
      </FilterBar>

      <Card>
        <Table
          className="admin-live-sessions-table"
          loading={loading}
          data={tableRows}
          emptyTitle={t('table.emptyTitle')}
          emptyDescription={t('table.emptyDescription')}
          columns={[
            { key: 'title', header: tableCols.title },
            { key: 'course', header: tableCols.course },
            { key: 'instructor', header: tableCols.instructor },
            { key: 'startAt', header: tableCols.startAt },
            { key: 'duration', header: tableCols.duration },
            {
              key: 'status',
              header: tableCols.status,
              render: (row) => (
                <Badge variant={statusVariant(String(row._raw?.status))}>
                  {statusLabels[String(row._raw?.status)] || row.status}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: tableCols.actions,
              width: '22rem',
              minWidth: '18rem',
              align: 'end',
              truncate: false,
              render: (row) => {
                const session = row._raw;
                return (
                  <div
                    className="table-actions live-session-row-actions"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    <Button variant="outline" size="sm" onClick={() => openDetail(session)}>
                      {t('actions.detail')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(session)}>
                      {t('actions.edit')}
                    </Button>
                    {session.meetingUrl ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(session.meetingUrl, '_blank', 'noopener,noreferrer')}
                      >
                        {t('actions.join')}
                      </Button>
                    ) : null}
                    {session.status === 'SCHEDULED' ? (
                      <Button variant="secondary" size="sm" onClick={() => setStatus(session, 'LIVE', t('toast.started'))}>
                        {t('actions.start')}
                      </Button>
                    ) : null}
                    {session.status === 'LIVE' ? (
                      <Button variant="secondary" size="sm" onClick={() => setStatus(session, 'ENDED', t('toast.ended'))}>
                        {t('actions.end')}
                      </Button>
                    ) : null}
                    {['SCHEDULED', 'LIVE'].includes(session.status) ? (
                      <Button variant="danger" size="sm" onClick={() => setCancelTarget(session)}>
                        {t('actions.cancel')}
                      </Button>
                    ) : null}
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(session)}>
                      {t('actions.delete')}
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      </Card>

      <Modal
        isOpen={detailOpen}
        title={t('detail.title')}
        onClose={() => { setDetailOpen(false); setSelected(null); }}
      >
        {selected ? (
          <div className="stack-sm">
            <div className="detail-row"><span>{detailFields.id}</span><strong>{selected.id}</strong></div>
            <div className="detail-row"><span>{detailFields.title}</span><strong>{selected.titleAr}</strong></div>
            <div className="detail-row"><span>{detailFields.course}</span><strong>{selected.course?.titleAr || empty}</strong></div>
            <div className="detail-row"><span>{detailFields.instructor}</span><strong>{selected.instructor?.fullName || empty}</strong></div>
            <div className="detail-row"><span>{detailFields.email}</span><strong>{selected.instructor?.email || empty}</strong></div>
            <div className="detail-row"><span>{detailFields.startAt}</span><strong>{fmtDate(selected.startAt)}</strong></div>
            <div className="detail-row"><span>{detailFields.duration}</span><strong>{fmtDurationMinutes(selected.durationMinutes)}</strong></div>
            <div className="detail-row">
              <span>{detailFields.meetingUrl}</span>
              {selected.meetingUrl ? (
                <a href={selected.meetingUrl} target="_blank" rel="noopener noreferrer" dir="ltr">
                  {selected.meetingUrl}
                </a>
              ) : (
                <strong>{empty}</strong>
              )}
            </div>
            <div className="detail-row">
              <span>{detailFields.status}</span>
              <Badge variant={statusVariant(selected.status)}>
                {statusLabels[selected.status] || selected.status}
              </Badge>
            </div>
            {selected.descriptionAr ? (
              <div className="detail-row"><span>{detailFields.description}</span><strong>{selected.descriptionAr}</strong></div>
            ) : null}
            <div className="chip-row">
              <Button variant="ghost" onClick={() => { setDetailOpen(false); openEdit(selected); }}>
                {t('actions.edit')}
              </Button>
              {selected.meetingUrl ? (
                <Button
                  variant="secondary"
                  onClick={() => window.open(selected.meetingUrl, '_blank', 'noopener,noreferrer')}
                >
                  {t('actions.joinSession')}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={editOpen}
        title={t('form.editTitle')}
        onClose={() => { setEditOpen(false); setSelected(null); setForm(emptyForm); }}
      >
        <form className="stack-sm" onSubmit={saveSession}>
          <Input
            label={t('form.titleLabel')}
            value={form.titleAr}
            onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            required
          />
          <Input
            label={t('form.startAtLabel')}
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            required
          />
          <Input
            label={t('form.durationLabel')}
            type="number"
            min="15"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
            required
          />
          <Input
            label={t('form.meetingUrlLabel')}
            value={form.meetingUrl}
            onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
            placeholder={t('form.meetingUrlPlaceholder')}
          />
          <Select
            label={t('form.statusLabel')}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={formStatusOptions}
          />
          <Textarea
            label={t('form.descriptionLabel')}
            value={form.descriptionAr}
            onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
          />
          <Button type="submit" loading={submitting}>{t('actions.saveChanges')}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        title={t('cancel.title')}
        message={t('cancel.message', { title: cancelTarget?.titleAr })}
        confirmLabel={t('actions.confirmCancel')}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('delete.title')}
        message={t('delete.message', { title: deleteTarget?.titleAr })}
        confirmLabel={t('common:actions.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
