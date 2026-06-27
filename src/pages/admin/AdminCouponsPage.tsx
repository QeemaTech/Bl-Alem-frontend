import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Gift, Plus, Table2, Tag } from '@/icons';
import { adminApi } from '../../api/admin';
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
import { useToast } from '../../components/ui/Toast';
import { useAdminCouponLabels } from '../../hooks/useAdminCouponLabels';
import { exportTableToExcel } from '../../utils/exportExcel';
import { formatNumber } from '../../utils/localeFormat';

const emptyForm = {
  code: '',
  type: 'PERCENTAGE',
  value: '',
  maxUses: '',
  startAt: '',
  expiresAt: '',
  minOrderAmount: '',
  appliesToAll: true,
  courseIds: [] as number[],
  status: 'ACTIVE',
};

export default function AdminCouponsPage() {
  const { t, i18n } = useTranslation(['coupons', 'common']);
  const { showToast } = useToast();
  const {
    statusLabels,
    typeLabels,
    fmtDate,
    formatValue,
    formatMoney,
    courseLabel,
    statusVariant,
    empty,
    unlimited,
  } = useAdminCouponLabels();

  const [items, setItems] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [detailTarget, setDetailTarget] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const cols = t('table.columns', { returnObjects: true, ns: 'coupons' }) as Record<string, string>;

  const exportColumns = useMemo(() => {
    const exportCols = t('export.columns', { returnObjects: true, ns: 'coupons' }) as Record<string, string>;
    return [
      { key: 'code', header: exportCols.code },
      { key: 'type', header: exportCols.type },
      { key: 'value', header: exportCols.value },
      { key: 'maxUses', header: exportCols.maxUses },
      { key: 'usedCount', header: exportCols.usedCount },
      { key: 'startAt', header: exportCols.startAt },
      { key: 'expiresAt', header: exportCols.expiresAt },
      { key: 'minOrderAmount', header: exportCols.minOrderAmount },
      { key: 'courses', header: exportCols.courses },
      { key: 'status', header: exportCols.status },
      { key: 'createdAt', header: exportCols.createdAt },
    ];
  }, [t]);

  const load = async () => {
    setLoading(true);
    try {
      const [coupons, courseList] = await Promise.all([
        adminApi.coupons(),
        adminApi.courses({ status: 'PUBLISHED' }).catch(() => adminApi.courses()),
      ]);
      setItems(coupons);
      setCourses(courseList || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (typeFilter) result = result.filter((i) => i.type === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) => String(i.code || '').toLowerCase().includes(q));
    }
    return result;
  }, [items, statusFilter, typeFilter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((i) => i.status === 'ACTIVE').length,
    inactive: items.filter((i) => i.status === 'INACTIVE').length,
    expired: items.filter((i) => i.status === 'EXPIRED').length,
    totalUses: items.reduce((sum, i) => sum + Number(i.usedCount || 0), 0),
  }), [items]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    code: row.code,
    type: typeLabels[row.type] || row.type,
    value: formatValue(row.type, Number(row.value)),
    maxUses: row.maxUses ?? unlimited,
    usedCount: String(row.usedCount ?? 0),
    startAt: fmtDate(row.startAt),
    expiresAt: fmtDate(row.expiresAt),
    minOrderAmount: row.minOrderAmount != null ? formatMoney(row.minOrderAmount) : empty,
    courses: courseLabel(row),
    status: statusLabels[row.status] || row.status,
    createdAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems, typeLabels, statusLabels, fmtDate, formatValue, formatMoney, courseLabel, empty, unlimited]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (coupon: any) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
      startAt: coupon.startAt ? new Date(coupon.startAt).toISOString().slice(0, 10) : '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : '',
      minOrderAmount: coupon.minOrderAmount != null ? String(coupon.minOrderAmount) : '',
      appliesToAll: coupon.appliesToAll !== false,
      courseIds: (coupon.courses || []).map((row: any) => row.courseId),
      status: coupon.status,
    });
    setFormOpen(true);
  };

  const openDetail = async (coupon: any) => {
    setDetailLoading(true);
    setDetailTarget(coupon);
    try {
      const full = await adminApi.coupon(coupon.id);
      setDetailTarget(full);
    } catch {
      showToast(t('toast.loadDetailFailed', { ns: 'coupons' }), 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleCourse = (courseId: number) => {
    setForm((current) => {
      const exists = current.courseIds.includes(courseId);
      return {
        ...current,
        courseIds: exists
          ? current.courseIds.filter((id) => id !== courseId)
          : [...current.courseIds, courseId],
      };
    });
  };

  const saveCoupon = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.appliesToAll && !form.courseIds.length) {
      showToast(t('toast.selectCourseOrAll', { ns: 'coupons' }), 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        startAt: form.startAt || null,
        expiresAt: form.expiresAt || null,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        appliesToAll: form.appliesToAll,
        courseIds: form.appliesToAll ? [] : form.courseIds,
        status: form.status,
      };
      if (editing) {
        await adminApi.updateCoupon(editing.id, payload);
        showToast(t('toast.updated', { ns: 'coupons' }), 'success');
      } else {
        await adminApi.createCoupon(payload);
        showToast(t('toast.created', { ns: 'coupons' }), 'success');
      }
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('toast.saveFailed', { ns: 'coupons' });
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (coupon: any) => {
    const next = coupon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminApi.couponStatus(coupon.id, next);
      showToast(
        next === 'ACTIVE' ? t('toast.enabled', { ns: 'coupons' }) : t('toast.disabled', { ns: 'coupons' }),
        'success',
      );
      load();
    } catch {
      showToast(t('toast.statusFailed', { ns: 'coupons' }), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteCoupon(deleteTarget.id);
      showToast(t('toast.deleted', { ns: 'coupons' }), 'success');
      setDeleteTarget(null);
      load();
    } catch {
      showToast(t('toast.deleteFailed', { ns: 'coupons' }), 'error');
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      t('export.sheetName', { ns: 'coupons' }),
      exportColumns,
      tableRows.map(({ _raw, ...row }) => row),
    );
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title={t('title', { ns: 'coupons' })} subtitle={t('subtitle', { ns: 'coupons' })} />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            {t('actions.exportExcel', { ns: 'coupons' })}
          </Button>
          <Button icon={<Plus size={18} />} onClick={openCreate}>
            {t('actions.add', { ns: 'coupons' })}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('stats.total', { ns: 'coupons' })} value={String(stats.total)} icon={Tag} />
        <StatCard title={t('stats.active', { ns: 'coupons' })} value={String(stats.active)} icon={Gift} />
        <StatCard title={t('stats.inactive', { ns: 'coupons' })} value={String(stats.inactive)} icon={Tag} />
        <StatCard title={t('stats.expired', { ns: 'coupons' })} value={String(stats.expired)} icon={Tag} />
        <StatCard title={t('stats.totalUses', { ns: 'coupons' })} value={String(stats.totalUses)} icon={Gift} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('filters.searchPlaceholder', { ns: 'coupons' })}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); }}
      >
        <Select
          label={t('filters.status', { ns: 'coupons' })}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: t('filters.allStatuses', { ns: 'coupons' }), value: '' },
            { label: statusLabels.ACTIVE, value: 'ACTIVE' },
            { label: statusLabels.INACTIVE, value: 'INACTIVE' },
            { label: statusLabels.EXPIRED, value: 'EXPIRED' },
          ]}
        />
        <Select
          label={t('filters.type', { ns: 'coupons' })}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { label: t('filters.allTypes', { ns: 'coupons' }), value: '' },
            { label: typeLabels.PERCENTAGE, value: 'PERCENTAGE' },
            { label: typeLabels.FIXED, value: 'FIXED' },
          ]}
        />
      </FilterBar>

      <Card className="reports-table-card">
        <div className="section-heading reports-table-head">
          <h2>
            <span className="reports-table-title-icon" aria-hidden="true">
              <Table2 size={20} />
            </span>
            {t('table.title', { ns: 'coupons' })}
          </h2>
          <span className="muted-count">
            {t('table.recordCount', {
              ns: 'coupons',
              count: formatNumber(filteredItems.length, undefined, i18n.language),
            })}
          </span>
        </div>
        <Table
          className="admin-users-table"
          loading={loading}
          stickyHeader
          compact
          fluid
          hideScrollNotice
          maxHeight="min(72vh, 760px)"
          data={tableRows}
          emptyTitle={t('table.emptyTitle', { ns: 'coupons' })}
          emptyDescription={t('table.emptyDescription', { ns: 'coupons' })}
          columns={[
            { key: 'code', header: cols.code, width: '8rem', truncate: false },
            { key: 'type', header: cols.type, hideOnMobile: true },
            { key: 'value', header: cols.value, width: '7rem', align: 'center' },
            { key: 'maxUses', header: cols.maxUses, hideOnMobile: true, align: 'center' },
            { key: 'usedCount', header: cols.usedCount, align: 'center' },
            { key: 'expiresAt', header: cols.expiresAt, hideOnMobile: true },
            { key: 'courses', header: cols.courses, hideOnMobile: true, truncate: true },
            {
              key: 'status',
              header: cols.status,
              width: '10.5rem',
              minWidth: '10.5rem',
              align: 'center',
              truncate: false,
              className: 'wd-col-status',
              render: (row) => (
                <Badge variant={statusVariant(String(row._raw?.status))} dot className="status-badge">
                  {statusLabels[String(row._raw?.status)] || row.status}
                </Badge>
              ),
            },
            { key: 'createdAt', header: cols.createdAt, hideOnMobile: true },
            {
              key: 'actions',
              header: cols.actions,
              width: '26rem',
              minWidth: '26rem',
              truncate: false,
              render: (row) => {
                const coupon = row._raw;
                return (
                  <div className="table-actions user-row-actions">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(coupon)}>
                      {t('actions.view', { ns: 'coupons' })}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(coupon)}>
                      {t('actions.edit', { ns: 'coupons' })}
                    </Button>
                    {coupon.status !== 'EXPIRED' ? (
                      <Button variant="secondary" size="sm" onClick={() => toggleStatus(coupon)}>
                        {coupon.status === 'ACTIVE'
                          ? t('actions.disable', { ns: 'coupons' })
                          : t('actions.enable', { ns: 'coupons' })}
                      </Button>
                    ) : null}
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(coupon)}>
                      {t('actions.delete', { ns: 'coupons' })}
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      </Card>

      <Modal
        isOpen={formOpen}
        title={editing ? t('modal.edit', { ns: 'coupons' }) : t('modal.create', { ns: 'coupons' })}
        onClose={() => { setFormOpen(false); setEditing(null); setForm(emptyForm); }}
      >
        <form className="stack-sm" onSubmit={saveCoupon}>
          <Input
            label={t('form.code', { ns: 'coupons' })}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder={t('form.codePlaceholder', { ns: 'coupons' })}
            required
            disabled={Boolean(editing)}
          />
          <Select
            label={t('form.discountType', { ns: 'coupons' })}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[
              { label: t('form.percentageOption', { ns: 'coupons' }), value: 'PERCENTAGE' },
              { label: t('form.fixedOption', { ns: 'coupons' }), value: 'FIXED' },
            ]}
          />
          <Input
            label={form.type === 'PERCENTAGE'
              ? t('form.percentageValue', { ns: 'coupons' })
              : t('form.fixedValue', { ns: 'coupons' })}
            type="number"
            min="1"
            max={form.type === 'PERCENTAGE' ? '100' : undefined}
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            required
          />
          <div className="grid-2">
            <Input
              label={t('form.startAt', { ns: 'coupons' })}
              type="date"
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            />
            <Input
              label={t('form.expiresAt', { ns: 'coupons' })}
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </div>
          <Input
            label={t('form.maxUses', { ns: 'coupons' })}
            type="number"
            min="1"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
            placeholder={t('form.maxUsesPlaceholder', { ns: 'coupons' })}
          />
          <Input
            label={t('form.minOrderAmount', { ns: 'coupons' })}
            type="number"
            min="0"
            step="0.01"
            value={form.minOrderAmount}
            onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
            placeholder={t('form.minOrderAmountPlaceholder', { ns: 'coupons' })}
          />
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.appliesToAll}
              onChange={(e) => setForm({ ...form, appliesToAll: e.target.checked, courseIds: e.target.checked ? [] : form.courseIds })}
              className="h-5 w-5 accent-primary"
            />
            <span className="text-sm font-semibold">{t('form.appliesToAll', { ns: 'coupons' })}</span>
          </label>
          {!form.appliesToAll ? (
            <div className="rounded-xl border border-outline bg-surface-container-low p-3">
              <span className="mb-2 block text-sm font-semibold">{t('form.appliedCourses', { ns: 'coupons' })}</span>
              <div className="stack-xs max-h-48 overflow-y-auto">
                {courses.length ? courses.map((course) => (
                  <label key={course.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.courseIds.includes(course.id)}
                      onChange={() => toggleCourse(course.id)}
                      className="accent-primary"
                    />
                    <span>{course.titleAr}</span>
                  </label>
                )) : (
                  <p className="text-sm text-on-surface-variant">{t('form.noPublishedCourses', { ns: 'coupons' })}</p>
                )}
              </div>
            </div>
          ) : null}
          <Select
            label={t('form.status', { ns: 'coupons' })}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { label: statusLabels.ACTIVE, value: 'ACTIVE' },
              { label: statusLabels.INACTIVE, value: 'INACTIVE' },
            ]}
          />
          <Button loading={submitting}>
            {editing ? t('actions.saveChanges', { ns: 'coupons' }) : t('actions.create', { ns: 'coupons' })}
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(detailTarget)}
        title={t('modal.detailTitle', { ns: 'coupons', code: detailTarget?.code || '' })}
        onClose={() => setDetailTarget(null)}
      >
        {detailTarget ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>{t('modal.detail.code', { ns: 'coupons' })}</span><strong dir="ltr">{detailTarget.code}</strong></div>
            <div className="detail-row"><span>{t('modal.detail.type', { ns: 'coupons' })}</span><strong>{typeLabels[detailTarget.type]}</strong></div>
            <div className="detail-row"><span>{t('modal.detail.value', { ns: 'coupons' })}</span><strong>{formatValue(detailTarget.type, Number(detailTarget.value))}</strong></div>
            <div className="detail-row">
              <span>{t('modal.detail.usage', { ns: 'coupons' })}</span>
              <strong>{detailTarget.usedCount ?? 0} / {detailTarget.maxUses ?? unlimited}</strong>
            </div>
            <div className="detail-row"><span>{t('modal.detail.start', { ns: 'coupons' })}</span><strong>{fmtDate(detailTarget.startAt)}</strong></div>
            <div className="detail-row"><span>{t('modal.detail.end', { ns: 'coupons' })}</span><strong>{fmtDate(detailTarget.expiresAt)}</strong></div>
            <div className="detail-row">
              <span>{t('modal.detail.minOrder', { ns: 'coupons' })}</span>
              <strong>{detailTarget.minOrderAmount != null ? formatMoney(detailTarget.minOrderAmount) : empty}</strong>
            </div>
            <div className="detail-row"><span>{cols.courses}</span><strong>{courseLabel(detailTarget)}</strong></div>
            <div className="detail-row">
              <span>{cols.status}</span>
              <Badge variant={statusVariant(detailTarget.status)}>{statusLabels[detailTarget.status]}</Badge>
            </div>
            {detailLoading ? (
              <p className="text-sm text-on-surface-variant">{t('modal.loadingUsage', { ns: 'coupons' })}</p>
            ) : detailTarget.usages?.length ? (
              <div className="mt-4">
                <strong className="mb-2 block">{t('modal.usageHistory', { ns: 'coupons' })}</strong>
                <Table
                  compact
                  data={detailTarget.usages.map((usage: any) => ({
                    user: usage.user?.fullName || empty,
                    amount: usage.payment?.finalAmount != null ? formatMoney(usage.payment.finalAmount) : empty,
                    status: usage.payment?.status || empty,
                    usedAt: fmtDate(usage.usedAt),
                  }))}
                  columns={[
                    { key: 'user', header: cols.user },
                    { key: 'amount', header: cols.amount },
                    { key: 'status', header: cols.payment },
                    { key: 'usedAt', header: cols.date },
                  ]}
                />
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">{t('modal.noUsage', { ns: 'coupons' })}</p>
            )}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('confirm.deleteTitle', { ns: 'coupons' })}
        message={t('confirm.deleteMessage', { ns: 'coupons', code: deleteTarget?.code })}
        confirmLabel={t('actions.delete', { ns: 'coupons' })}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
