import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowDownToLine, Banknote, Clock, Download, TrendingUp, Wallet,
} from '@/icons';
import { instructorApi } from '../../api/instructor';
import { ReportChart } from '../../components/reports/ReportChart';
import { withdrawalStatusVariant } from '../../components/admin/withdrawals/types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { FilterBar } from '../../components/ui/FilterBar';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { formatMoney, roundMoney } from '../../utils/formatMoney';
import { exportTableToExcel } from '../../utils/exportExcel';
import { formatDateTime } from '../../utils/localeFormat';
import { localizedCourseTitle } from '../../utils/localizedContent';
import { mediaUrl } from '../../utils/mediaUrl';
import { isValidPayoutPhone, normalizePayoutPhone } from '../../utils/payoutPhone';
import { WITHDRAWAL_TRANSFER_TYPES } from '../../utils/withdrawalTransferTypes';

const WITHDRAWAL_STATUSES = ['PENDING', 'APPROVED', 'PAID', 'REJECTED'] as const;

const emptyWithdrawForm = {
  amount: '',
  phone: '',
  transferType: 'VODAFONE_CASH',
  notes: '',
};

export default function InstructorEarningsPage() {
  const { t, i18n } = useTranslation('dashboard');
  const { t: tw } = useTranslation('withdrawals');
  const { t: tc } = useTranslation('common');
  const { t: tl } = useTranslation('liveSessions');
  const lang = i18n.language;
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyWithdrawForm);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const dash = tl('empty');

  const getStatusLabel = useCallback(
    (status: string) => tw(`admin.labels.status.${status}`, { defaultValue: status }),
    [tw, lang],
  );

  const fmtDate = useCallback(
    (value: string) => formatDateTime(value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }, lang),
    [lang],
  );

  const fmtMoney = useCallback(
    (value: number | string | null | undefined) => formatMoney(value, undefined, lang),
    [lang],
  );

  const exportColumns = useMemo(() => {
    const cols = t('instructor.earnings.export.columns', { returnObjects: true }) as Record<string, string>;
    return [
      { key: 'amount', header: cols.amount },
      { key: 'status', header: cols.status },
      { key: 'phone', header: cols.phone },
      { key: 'transferType', header: cols.transferType },
      { key: 'createdAt', header: cols.createdAt },
      { key: 'notes', header: cols.notes },
    ];
  }, [t, lang]);

  const load = async () => {
    setLoading(true);
    setData(await instructorApi.earnings());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const commission = Number(data?.platformCommission || 0.2);

  const salesChart = useMemo(() => {
    if (!data?.salesByCourse) return [];
    return data.salesByCourse
      .map((course: any) => ({
        label: localizedCourseTitle(course, lang),
        value: roundMoney(
          (course.payments || []).reduce((sum: number, p: any) => sum + Number(p.finalAmount || 0), 0)
            * (1 - commission),
        ),
      }))
      .filter((item: { value: number }) => item.value > 0)
      .sort((a: { value: number }, b: { value: number }) => b.value - a.value)
      .slice(0, 6);
  }, [data, commission, lang]);

  const withdrawals = data?.withdrawals || [];

  const hasActiveFilters = Boolean(search.trim() || statusFilter);

  const normalizeSearchText = (value: unknown) => String(value ?? '').toLowerCase().trim();

  const transferTypeOptions = useMemo(
    () => WITHDRAWAL_TRANSFER_TYPES.map((value) => ({
      value,
      label: tw(`admin.labels.transferTypes.${value}`),
    })),
    [tw],
  );

  const getTransferTypeLabel = useCallback(
    (type: string) => tw(`admin.labels.transferTypes.${type}`, { defaultValue: type }),
    [tw],
  );
  const withdrawalSearchText = useCallback((item: any) => normalizeSearchText([
    item.id,
    item.phone,
    getTransferTypeLabel(String(item.transferType || '')),
    item.notes,
    item.adminNotes,
    item.amount,
    fmtDate(String(item.createdAt || '')),
    getStatusLabel(item.status),
    item.status,
  ].join(' ')), [fmtDate, getStatusLabel, getTransferTypeLabel]);

  const filteredWithdrawals = useMemo(() => {
    let result = withdrawals as any[];
    if (statusFilter) {
      result = result.filter((item) => String(item.status) === statusFilter);
    }
    const q = normalizeSearchText(search);
    if (q) {
      result = result.filter((item) => withdrawalSearchText(item).includes(q));
    }
    return result;
  }, [withdrawals, statusFilter, search, withdrawalSearchText]);

  const stats = useMemo(() => {
    const pending = withdrawals.filter((i: any) => i.status === 'PENDING');
    const paid = withdrawals.filter((i: any) => i.status === 'PAID');
    return {
      pendingCount: pending.length,
      paidCount: paid.length,
      salesCount: data?.recentTransactions?.length || 0,
    };
  }, [withdrawals, data]);

  const statusOptions = useMemo(() => [
    { label: tc('status.all'), value: '' },
    ...WITHDRAWAL_STATUSES.map((status) => ({
      label: getStatusLabel(status),
      value: status,
    })),
  ], [tc, getStatusLabel, lang]);

  const openWithdrawModal = () => {
    const withdrawable = roundMoney(data?.withdrawableBalance ?? data?.availableBalance ?? 0);
    setForm({
      ...emptyWithdrawForm,
      amount: withdrawable ? String(withdrawable) : '',
    });
    setOpen(true);
  };

  const withdraw = async (e: FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    const amount = roundMoney(form.amount);
    const withdrawableNow = roundMoney(data?.withdrawableBalance ?? 0);
    const minAmount = roundMoney(data?.minWithdrawalAmount || 0);
    const phone = normalizePayoutPhone(form.phone);
    const transferType = form.transferType.trim();

    if (amount <= 0) {
      showToast(t('instructor.earnings.toast.invalidAmount'), 'error');
      return;
    }
    if (amount > withdrawableNow) {
      showToast(
        t('instructor.earnings.toast.amountExceedsBalance', { max: fmtMoney(withdrawableNow) }),
        'error',
      );
      return;
    }
    if (minAmount > 0 && amount < minAmount) {
      showToast(t('instructor.earnings.toast.minAmount', { amount: fmtMoney(minAmount) }), 'error');
      return;
    }
    if (!phone) {
      showToast(t('instructor.earnings.toast.phoneRequired'), 'error');
      return;
    }
    if (!isValidPayoutPhone(phone)) {
      showToast(t('instructor.earnings.toast.invalidPhone'), 'error');
      return;
    }
    if (!WITHDRAWAL_TRANSFER_TYPES.includes(transferType as typeof WITHDRAWAL_TRANSFER_TYPES[number])) {
      showToast(t('instructor.earnings.toast.invalidTransferType'), 'error');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await instructorApi.requestWithdrawal({
        amount,
        phone,
        transferType,
        notes: form.notes.trim() || undefined,
      });
      setOpen(false);
      setForm(emptyWithdrawForm);
      showToast(t('instructor.earnings.toast.submitted'), 'success');
      await load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('instructor.earnings.toast.submitFailed');
      showToast(message, 'error');
      await load();
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    exportTableToExcel(t('instructor.earnings.export.sheetName'), exportColumns, filteredWithdrawals.map((row: any) => ({
      amount: fmtMoney(row.amount),
      status: getStatusLabel(row.status),
      phone: row.phone || dash,
      transferType: getTransferTypeLabel(String(row.transferType || '')),
      createdAt: fmtDate(row.createdAt),
      notes: row.notes || dash,
    })));
  };

  if (loading) return <DashboardSkeleton />;

  const available = roundMoney(data?.availableBalance || 0);
  const withdrawable = roundMoney(data?.withdrawableBalance ?? available);
  const hasPending = withdrawals.some((i: any) => i.status === 'PENDING');
  const pendingRequest = withdrawals.find((i: any) => i.status === 'PENDING');
  const minWithdrawalAmount = roundMoney(data?.minWithdrawalAmount || 0);
  const canOpenWithdrawModal = withdrawable >= minWithdrawalAmount;
  const canSubmitWithdrawal = canOpenWithdrawModal && !hasPending;

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title={t('instructor.earnings.title')}
          subtitle={t('instructor.earnings.subtitle')}
        />
        <div className="reports-actions">
          <Button
            icon={<ArrowDownToLine size={18} />}
            onClick={openWithdrawModal}
            disabled={!canOpenWithdrawModal}
          >
            {t('instructor.earnings.requestWithdrawal')}
          </Button>
        </div>
      </div>

      {hasPending ? (
        <Card className="withdraw-blocked-notice">
          <Clock size={20} />
          <div>
            <strong>{t('instructor.earnings.pendingNotice.title')}</strong>
            <p>
              {t('instructor.earnings.pendingNotice.body', { amount: fmtMoney(pendingRequest?.amount) })}
            </p>
          </div>
        </Card>
      ) : null}

      {available > 0 && available < minWithdrawalAmount ? (
        <Card className="withdraw-blocked-notice is-warning">
          <Wallet size={20} />
          <div>
            <strong>{t('instructor.earnings.minBalanceNotice.title')}</strong>
            <p>
              {t('instructor.earnings.minBalanceNotice.body', {
                min: fmtMoney(minWithdrawalAmount),
                available: fmtMoney(available),
              })}
            </p>
          </div>
        </Card>
      ) : null}

      <div className="stats-grid">
        <StatCard
          title={t('instructor.earnings.stats.totalEarnings')}
          value={fmtMoney(data?.totalEarnings)}
          icon={TrendingUp}
          hint={t('instructor.earnings.stats.totalEarningsHint')}
        />
        <StatCard
          title={t('instructor.earnings.stats.availableBalance')}
          value={fmtMoney(withdrawable)}
          icon={Wallet}
          hint={
            hasPending
              ? t('instructor.earnings.stats.withdrawableNow', { amount: fmtMoney(withdrawable) })
              : data?.approvedBalance > 0
                ? t('instructor.earnings.stats.approvedAwaitingTransfer', { amount: fmtMoney(data.approvedBalance) })
                : available >= minWithdrawalAmount
                  ? t('instructor.earnings.stats.readyToWithdraw')
                  : available > 0
                    ? t('instructor.earnings.stats.minWithdrawal', { amount: fmtMoney(minWithdrawalAmount) })
                    : t('instructor.earnings.stats.noBalance')
          }
        />
        <StatCard
          title={t('instructor.earnings.stats.pendingBalance')}
          value={fmtMoney(data?.pendingBalance)}
          icon={Clock}
          hint={stats.pendingCount
            ? t('instructor.earnings.stats.pendingRequests', { count: stats.pendingCount })
            : t('instructor.earnings.stats.noPendingRequests')}
        />
        <StatCard
          title={t('instructor.earnings.stats.platformCommission')}
          value={`${roundMoney(commission * 100)}%`}
          icon={Banknote}
        />
      </div>

      {salesChart.length ? (
        <div className="reports-charts-grid">
          <ReportChart title={t('instructor.earnings.charts.courseEarnings')} type="bar" data={salesChart} />
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('instructor.earnings.filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
        resetDisabled={!hasActiveFilters}
        extraActions={(
          <Button
            type="button"
            variant="outline"
            icon={<Download size={16} />}
            onClick={handleExport}
            disabled={!filteredWithdrawals.length}
          >
            {tw('admin.exportExcel')}
          </Button>
        )}
      >
        <Select
          label={t('instructor.earnings.filters.withdrawalStatus')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusOptions}
        />
      </FilterBar>

      <Card>
        <div className="section-heading">
          <h2>{t('instructor.earnings.withdrawals.title')}</h2>
          <span className="muted-count">
            {hasActiveFilters
              ? t('instructor.earnings.withdrawals.countFiltered', {
                filtered: filteredWithdrawals.length,
                total: withdrawals.length,
              })
              : t('instructor.earnings.withdrawals.count', { count: filteredWithdrawals.length })}
          </span>
        </div>
        <Table
          data={filteredWithdrawals}
          showHeadersWhenEmpty={hasActiveFilters}
          emptyTitle={hasActiveFilters
            ? t('instructor.earnings.withdrawals.emptyFilteredTitle')
            : t('instructor.earnings.withdrawals.emptyTitle')}
          emptyDescription={
            hasActiveFilters
              ? t('instructor.earnings.withdrawals.emptyFilteredDesc')
              : t('instructor.earnings.withdrawals.emptyDesc')
          }
          columns={[
            {
              key: 'amount',
              header: tw('admin.detail.amount'),
              render: (row) => <strong>{fmtMoney(Number(row.amount))}</strong>,
            },
            {
              key: 'status',
              header: tw('admin.detail.status'),
              render: (row) => (
                <Badge variant={withdrawalStatusVariant[String(row.status) as keyof typeof withdrawalStatusVariant] || 'default'}>
                  {getStatusLabel(String(row.status))}
                </Badge>
              ),
            },
            { key: 'phone', header: t('instructor.earnings.withdrawModal.phoneLabel'), render: (row) => <span dir="ltr">{String(row.phone || dash)}</span> },
            { key: 'transferType', header: t('instructor.earnings.withdrawModal.transferTypeLabel'), render: (row) => getTransferTypeLabel(String(row.transferType || '')) },
            {
              key: 'createdAt',
              header: tw('admin.detail.requestDate'),
              render: (row) => fmtDate(String(row.createdAt)),
            },
            {
              key: 'actions',
              header: tw('admin.table.columns.actions'),
              render: (row) => (
                <Button variant="ghost" size="sm" onClick={() => setSelected(row)}>
                  {tw('admin.actions.detail')}
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Card>
        <div className="section-heading">
          <h2>{t('instructor.earnings.sales.title')}</h2>
          <span className="muted-count">{t('instructor.earnings.sales.count', { count: stats.salesCount })}</span>
        </div>
        <Table
          data={data?.recentTransactions || []}
          emptyTitle={t('instructor.earnings.sales.emptyTitle')}
          emptyDescription={t('instructor.earnings.sales.emptyDesc')}
          columns={[
            {
              key: 'course',
              header: t('instructor.earnings.sales.columns.course'),
              render: (row) => localizedCourseTitle((row.course as any), lang) || dash,
            },
            {
              key: 'user',
              header: t('instructor.earnings.sales.columns.student'),
              render: (row) => String((row.user as any)?.fullName || dash),
            },
            {
              key: 'finalAmount',
              header: t('instructor.earnings.sales.columns.amount'),
              render: (row) => fmtMoney(Number(row.finalAmount)),
            },
            {
              key: 'net',
              header: t('instructor.earnings.sales.columns.net'),
              render: (row) => fmtMoney(roundMoney(Number(row.finalAmount) * (1 - commission))),
            },
            {
              key: 'createdAt',
              header: t('instructor.earnings.sales.columns.date'),
              render: (row) => fmtDate(String(row.createdAt)),
            },
          ]}
        />
      </Card>

      <Modal isOpen={open} title={t('instructor.earnings.withdrawModal.title')} onClose={() => !submitting && setOpen(false)}>
        <div className="withdraw-modal-summary">
          <div>
            <span>{t('instructor.earnings.withdrawModal.withdrawableNow')}</span>
            <strong>{fmtMoney(withdrawable)}</strong>
          </div>
          <div>
            <span>{t('instructor.earnings.withdrawModal.availableBalance')}</span>
            <strong>{fmtMoney(available)}</strong>
          </div>
          {hasPending ? (
            <p className="field-helper">
              {t('instructor.earnings.withdrawModal.withdrawableHelper', {
                withdrawable: fmtMoney(withdrawable),
                pending: fmtMoney(pendingRequest?.amount),
              })}
            </p>
          ) : null}
          {hasPending ? (
            <div className="withdraw-pending-alert">
              <strong>{t('instructor.earnings.withdrawModal.cannotSubmitTitle')}</strong>
              <p>
                {t('instructor.earnings.withdrawModal.cannotSubmitBody', {
                  amount: fmtMoney(pendingRequest?.amount),
                })}
              </p>
            </div>
          ) : null}
          {minWithdrawalAmount > 0 && !hasPending ? (
            <p className="field-helper">{t('instructor.earnings.withdrawModal.minAmount', { amount: fmtMoney(minWithdrawalAmount) })}</p>
          ) : null}
          {available > 0 && available < minWithdrawalAmount && !hasPending ? (
            <p className="field-helper">{t('instructor.earnings.withdrawModal.belowMin')}</p>
          ) : null}
        </div>
        <form className="stack-sm withdraw-modal-form" onSubmit={withdraw}>
          <Input
            label={t('instructor.earnings.withdrawModal.amountLabel')}
            type="number"
            min={minWithdrawalAmount || 1}
            max={withdrawable}
            step="0.01"
            value={form.amount}
            helper={t('instructor.earnings.withdrawModal.amountHelper', {
              min: fmtMoney(minWithdrawalAmount),
              max: fmtMoney(withdrawable),
            })}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            disabled={!canSubmitWithdrawal}
            required
          />
          <Select
            label={t('instructor.earnings.withdrawModal.transferTypeLabel')}
            value={form.transferType}
            onChange={(e) => setForm({ ...form, transferType: e.target.value })}
            options={transferTypeOptions}
            disabled={!canSubmitWithdrawal}
            required
          />
          <Input
            label={t('instructor.earnings.withdrawModal.phoneLabel')}
            value={form.phone}
            placeholder="01xxxxxxxxx"
            dir="ltr"
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            disabled={!canSubmitWithdrawal}
            required
          />
          <Textarea
            label={t('instructor.earnings.withdrawModal.notesLabel')}
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            disabled={!canSubmitWithdrawal}
          />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              {tc('actions.cancel')}
            </Button>
            <Button type="submit" loading={submitting} disabled={!canSubmitWithdrawal}>
              {t('instructor.earnings.withdrawModal.submit')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(selected)} title={t('instructor.earnings.detail.title')} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>{tw('admin.detail.amount')}</span><strong>{fmtMoney(selected.amount)}</strong></div>
            <div className="detail-row">
              <span>{tw('admin.detail.status')}</span>
              <Badge variant={withdrawalStatusVariant[selected.status as keyof typeof withdrawalStatusVariant] || 'default'}>{getStatusLabel(selected.status)}</Badge>
            </div>
            <div className="detail-row"><span>{t('instructor.earnings.withdrawModal.phoneLabel')}</span><strong dir="ltr">{selected.phone || dash}</strong></div>
            <div className="detail-row"><span>{t('instructor.earnings.withdrawModal.transferTypeLabel')}</span><strong>{getTransferTypeLabel(String(selected.transferType || ''))}</strong></div>
            <div className="detail-row"><span>{tw('admin.detail.requestDate')}</span><strong>{fmtDate(selected.createdAt)}</strong></div>
            {selected.notes ? (
              <div className="detail-row"><span>{tw('admin.detail.notes')}</span><strong>{selected.notes}</strong></div>
            ) : null}
            {selected.adminNotes ? (
              <div className="detail-row"><span>{tw('admin.rejectModal.reasonLabel')}</span><strong>{selected.adminNotes}</strong></div>
            ) : null}
            {selected.transferProofImage ? (
              <div className="withdrawal-proof-block">
                <strong>{t('instructor.earnings.detail.transferProof')}</strong>
                <a href={mediaUrl(selected.transferProofImage)} target="_blank" rel="noreferrer">
                  <img
                    src={mediaUrl(selected.transferProofImage)}
                    alt={t('instructor.earnings.detail.transferProofAlt')}
                    className="withdrawal-proof-image"
                  />
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
