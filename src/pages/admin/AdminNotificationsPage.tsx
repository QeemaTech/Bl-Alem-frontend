import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, Download, Send } from '@/icons';
import { adminApi } from '../../api/admin';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FilterBar } from '../../components/ui/FilterBar';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { useAdminNotificationLabels } from '../../hooks/useAdminNotificationLabels';
import { exportTableToExcel } from '../../utils/exportExcel';

export default function AdminNotificationsPage() {
  const { t } = useTranslation(['notifications', 'common']);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    readStatusLabels,
    getTypeLabel,
    getRoleLabel,
    getReadStatusLabel,
    fmtNotificationDate,
    empty,
  } = useAdminNotificationLabels();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sendOpen, setSendOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    targetType: 'ALL',
    userId: '',
    titleAr: '',
    bodyAr: '',
    type: 'ADMIN',
  });

  const exportColumns = useMemo(() => {
    const cols = t('admin.export.columns', { returnObjects: true, ns: 'notifications' }) as Record<string, string>;
    return [
      { key: 'id', header: cols.id },
      { key: 'recipient', header: cols.recipient },
      { key: 'email', header: cols.email },
      { key: 'role', header: cols.role },
      { key: 'title', header: cols.title },
      { key: 'body', header: cols.body },
      { key: 'type', header: cols.type },
      { key: 'readStatus', header: cols.readStatus },
      { key: 'createdAt', header: cols.createdAt },
    ];
  }, [t]);

  const tableColumns = useMemo(() => {
    const cols = t('admin.table.columns', { returnObjects: true, ns: 'notifications' }) as Record<string, string>;
    return cols;
  }, [t]);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await adminApi.notifications());
    } catch {
      showToast(t('admin.toast.loadFailed', { ns: 'notifications' }), 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openDetail = (id: number) => navigate(`/admin/notifications/${id}`);

  const filteredItems = useMemo(() => {
    let result = items;
    if (typeFilter) result = result.filter((i) => i.type === typeFilter);
    if (readFilter === 'read') result = result.filter((i) => i.isRead);
    if (readFilter === 'unread') result = result.filter((i) => !i.isRead);
    if (roleFilter) result = result.filter((i) => i.user?.role === roleFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [i.titleAr, i.bodyAr, i.user?.fullName, i.user?.email, getTypeLabel(i.type), String(i.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, typeFilter, readFilter, roleFilter, search, getTypeLabel]);

  const stats = useMemo(() => ({
    total: items.length,
    unread: items.filter((i) => !i.isRead).length,
    read: items.filter((i) => i.isRead).length,
    adminSent: items.filter((i) => i.type === 'ADMIN').length,
  }), [items]);

  const typeOptions = useMemo(() => {
    const types = [...new Set(items.map((i) => i.type).filter(Boolean))].sort();
    return [
      { label: t('admin.filters.allTypes', { ns: 'notifications' }), value: '' },
      ...types.map((type) => ({ label: getTypeLabel(type), value: type })),
    ];
  }, [items, t, getTypeLabel]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    recipient: row.user?.fullName || empty,
    email: row.user?.email || empty,
    role: getRoleLabel(row.user?.role) || empty,
    title: row.titleAr,
    body: row.bodyAr?.length > 50 ? `${row.bodyAr.slice(0, 50)}...` : row.bodyAr,
    type: getTypeLabel(row.type) || empty,
    readStatus: getReadStatusLabel(row.isRead),
    createdAt: fmtNotificationDate(row.createdAt),
    _raw: row,
  })), [filteredItems, empty, getRoleLabel, getTypeLabel, getReadStatusLabel, fmtNotificationDate]);

  const hasActiveFilters = Boolean(search.trim() || typeFilter || readFilter || roleFilter);

  const sendNotification = async (e: FormEvent) => {
    e.preventDefault();
    const titleAr = form.titleAr.trim();
    const bodyAr = form.bodyAr.trim();
    if (!titleAr || !bodyAr) {
      showToast(t('admin.toast.titleBodyRequired', { ns: 'notifications' }), 'error');
      return;
    }
    if (form.targetType === 'SPECIFIC_USER' && !form.userId.trim()) {
      showToast(t('admin.toast.userIdRequired', { ns: 'notifications' }), 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        targetType: form.targetType,
        titleAr,
        bodyAr,
        type: form.type,
        ...(form.targetType === 'SPECIFIC_USER' ? { userId: Number(form.userId) } : {}),
      };
      const result = await adminApi.sendNotification(payload);
      showToast(t('admin.toast.sentSuccess', { count: result?.sent ?? 0, ns: 'notifications' }), 'success');
      setSendOpen(false);
      setForm({ targetType: 'ALL', userId: '', titleAr: '', bodyAr: '', type: 'ADMIN' });
      await load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('admin.toast.sendFailed', { ns: 'notifications' });
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      t('admin.export.sheetName', { ns: 'notifications' }),
      exportColumns,
      tableRows.map(({ _raw, body, ...row }) => ({
        ...row,
        body: _raw.bodyAr || body,
      })),
    );
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title={t('admin.title', { ns: 'notifications' })}
          subtitle={t('admin.subtitle', { ns: 'notifications' })}
        />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            {t('admin.exportExcel', { ns: 'notifications' })}
          </Button>
          <Button icon={<Send size={18} />} onClick={() => setSendOpen(true)}>
            {t('admin.sendNotification', { ns: 'notifications' })}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('admin.stats.total', { ns: 'notifications' })} value={String(stats.total)} icon={Bell} />
        <StatCard title={t('admin.stats.unread', { ns: 'notifications' })} value={String(stats.unread)} icon={BellOff} />
        <StatCard title={t('admin.stats.read', { ns: 'notifications' })} value={String(stats.read)} icon={Bell} />
        <StatCard title={t('admin.stats.adminSent', { ns: 'notifications' })} value={String(stats.adminSent)} icon={Send} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('admin.filters.searchPlaceholder', { ns: 'notifications' })}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setTypeFilter(''); setReadFilter(''); setRoleFilter(''); }}
        resetDisabled={!hasActiveFilters}
        ariaLabel={t('admin.filters.ariaLabel', { ns: 'notifications' })}
      >
        <Select
          label={t('admin.filters.type', { ns: 'notifications' })}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={typeOptions}
        />
        <Select
          label={t('admin.filters.readStatus', { ns: 'notifications' })}
          value={readFilter}
          onChange={(e) => setReadFilter(e.target.value)}
          options={[
            { label: t('admin.filters.all', { ns: 'notifications' }), value: '' },
            { label: readStatusLabels.unread, value: 'unread' },
            { label: readStatusLabels.read, value: 'read' },
          ]}
        />
        <Select
          label={t('admin.filters.recipientRole', { ns: 'notifications' })}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={[
            { label: t('admin.filters.all', { ns: 'notifications' }), value: '' },
            { label: t('admin.filters.students', { ns: 'notifications' }), value: 'STUDENT' },
            { label: t('admin.filters.instructors', { ns: 'notifications' }), value: 'INSTRUCTOR' },
            { label: t('admin.filters.admins', { ns: 'notifications' }), value: 'SUPER_ADMIN' },
          ]}
        />
      </FilterBar>

      <Card className="reports-table-card">
        <Table
          loading={loading}
          data={tableRows}
          emptyTitle={t('admin.table.emptyTitle', { ns: 'notifications' })}
          emptyDescription={t('admin.table.emptyDescription', { ns: 'notifications' })}
          onRowClick={(row) => openDetail(row._raw.id)}
          columns={[
            { key: 'id', header: tableColumns.id },
            { key: 'recipient', header: tableColumns.recipient },
            { key: 'role', header: tableColumns.role },
            { key: 'title', header: tableColumns.title },
            { key: 'type', header: tableColumns.type },
            {
              key: 'readStatus',
              header: tableColumns.status,
              render: (row) => (
                <Badge
                  variant={row._raw?.isRead ? 'default' : 'info'}
                  dot
                  className="status-badge"
                >
                  {row.readStatus}
                </Badge>
              ),
            },
            { key: 'createdAt', header: tableColumns.createdAt },
            {
              key: 'actions',
              header: tableColumns.actions,
              render: (row) => (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetail(row._raw.id);
                  }}
                >
                  {t('admin.actions.detail', { ns: 'notifications' })}
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal isOpen={sendOpen} title={t('admin.sendModal.title', { ns: 'notifications' })} onClose={() => setSendOpen(false)}>
        <form className="stack-sm" onSubmit={sendNotification}>
          <Select
            label={t('admin.sendModal.targetType', { ns: 'notifications' })}
            value={form.targetType}
            onChange={(e) => setForm({ ...form, targetType: e.target.value })}
            options={[
              { label: t('admin.sendModal.targetAll', { ns: 'notifications' }), value: 'ALL' },
              { label: t('admin.sendModal.targetStudents', { ns: 'notifications' }), value: 'STUDENTS' },
              { label: t('admin.sendModal.targetInstructors', { ns: 'notifications' }), value: 'INSTRUCTORS' },
              { label: t('admin.sendModal.targetSpecificUser', { ns: 'notifications' }), value: 'SPECIFIC_USER' },
            ]}
          />
          {form.targetType === 'SPECIFIC_USER' ? (
            <Input
              label={t('admin.sendModal.userId', { ns: 'notifications' })}
              type="number"
              min={1}
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              required
            />
          ) : null}
          <Select
            label={t('admin.sendModal.notificationType', { ns: 'notifications' })}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[
              { label: getTypeLabel('ADMIN'), value: 'ADMIN' },
              { label: getTypeLabel('WELCOME'), value: 'WELCOME' },
              { label: getTypeLabel('LIVE_SESSION'), value: 'LIVE_SESSION' },
              { label: getTypeLabel('PAYMENT'), value: 'PAYMENT' },
              { label: getTypeLabel('COURSE'), value: 'COURSE' },
            ]}
          />
          <Input
            label={t('admin.sendModal.titleField', { ns: 'notifications' })}
            value={form.titleAr}
            onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            required
          />
          <Textarea
            label={t('admin.sendModal.body', { ns: 'notifications' })}
            value={form.bodyAr}
            onChange={(e) => setForm({ ...form, bodyAr: e.target.value })}
            required
          />
          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={() => setSendOpen(false)}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" loading={submitting}>
              {t('admin.sendModal.submit', { ns: 'notifications' })}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
