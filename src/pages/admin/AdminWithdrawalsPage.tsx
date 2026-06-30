import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/admin';
import { WithdrawalActionButtons } from '../../components/admin/withdrawals/WithdrawalActionButtons';
import { WithdrawalStatusBadge } from '../../components/admin/withdrawals/WithdrawalStatusBadge';
import { WithdrawalsFiltersBar, type WithdrawalsFilters } from '../../components/admin/withdrawals/WithdrawalsFiltersBar';
import { WithdrawalsSummaryCards } from '../../components/admin/withdrawals/WithdrawalsSummaryCards';
import { WithdrawalsTable } from '../../components/admin/withdrawals/WithdrawalsTable';
import { WithdrawTransferForm } from '../../components/admin/withdrawals/WithdrawTransferForm';
import {
  type WithdrawalActionType,
  type WithdrawalItem,
} from '../../components/admin/withdrawals/types';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { useAdminWithdrawalLabels } from '../../hooks/useAdminWithdrawalLabels';
import { Download } from '@/icons';
import { exportTableToExcel } from '../../utils/exportExcel';
import { mediaUrl, normalizeStoredMediaPath } from '../../utils/mediaUrl';

const EMPTY_FILTERS: WithdrawalsFilters = {
  status: '',
  dateFrom: '',
  dateTo: '',
};

export default function AdminWithdrawalsPage() {
  const { t } = useTranslation(['withdrawals', 'common']);
  const { showToast } = useToast();
  const {
    fmtWithdrawalDate,
    fmtWithdrawalMoney,
    getStatusLabel,
    getTransferTypeLabel,
    empty,
  } = useAdminWithdrawalLabels();

  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<WithdrawalsFilters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<WithdrawalItem | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [paidOpen, setPaidOpen] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [transferFile, setTransferFile] = useState<File | null>(null);
  const [transferPreview, setTransferPreview] = useState('');
  const [submittingPaid, setSubmittingPaid] = useState(false);
  const [submittingReject, setSubmittingReject] = useState(false);
  const [loadingAction, setLoadingAction] = useState<{ id: number; type: WithdrawalActionType } | null>(null);

  const exportColumns = useMemo(() => {
    const cols = t('admin.export.columns', { returnObjects: true, ns: 'withdrawals' }) as Record<string, string>;
    return [
      { key: 'id', header: cols.id },
      { key: 'instructor', header: cols.instructor },
      { key: 'email', header: cols.email },
      { key: 'amount', header: cols.amount },
      { key: 'phone', header: cols.phone },
      { key: 'transferType', header: cols.transferType },
      { key: 'status', header: cols.status },
      { key: 'createdAt', header: cols.createdAt },
      { key: 'notes', header: cols.notes },
    ];
  }, [t]);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await adminApi.withdrawals());
    } catch {
      showToast(t('admin.toast.loadFailed', { ns: 'withdrawals' }), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (filters.status) result = result.filter((i) => i.status === filters.status);
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((i) => new Date(i.createdAt) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((i) => new Date(i.createdAt) <= to);
    }
    return result;
  }, [items, filters]);

  const stats = useMemo(() => ({
    total: items.length,
    pendingCount: items.filter((i) => i.status === 'PENDING').length,
    approvedCount: items.filter((i) => i.status === 'APPROVED').length,
    paidCount: items.filter((i) => i.status === 'PAID').length,
    rejectedCount: items.filter((i) => i.status === 'REJECTED').length,
  }), [items]);

  const handleExport = () => {
    exportTableToExcel(
      t('admin.export.sheetName', { ns: 'withdrawals' }),
      exportColumns,
      filteredItems.map((row) => ({
        id: row.id,
        instructor: row.instructor?.fullName || empty,
        email: row.instructor?.email || empty,
        amount: fmtWithdrawalMoney(row.amount),
        phone: row.phone || empty,
        transferType: getTransferTypeLabel(String(row.transferType || '')),
        status: getStatusLabel(row.status),
        createdAt: fmtWithdrawalDate(row.createdAt),
        notes: row.notes || empty,
      })),
    );
  };

  const resetPaidModal = () => {
    setPaidOpen(false);
    setTransferFile(null);
    setTransferPreview('');
    setSelected(null);
  };

  const openPaidModal = (item: WithdrawalItem) => {
    setSelected(item);
    setTransferFile(null);
    setTransferPreview('');
    setPaidOpen(true);
  };

  const handleApprove = async () => {
    if (!selected) return;
    const approvedId = selected.id;
    setLoadingAction({ id: selected.id, type: 'approve' });
    try {
      await adminApi.approveWithdrawal(selected.id);
      showToast(t('admin.toast.approved', { ns: 'withdrawals' }), 'success');
      setConfirmApproveOpen(false);
      const refreshed = await adminApi.withdrawals();
      setItems(refreshed);
      const approvedItem = refreshed.find((item: WithdrawalItem) => item.id === approvedId);
      if (approvedItem) openPaidModal(approvedItem);
      else setSelected(null);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('admin.toast.approveFailed', { ns: 'withdrawals' });
      showToast(message, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTransferFile = (file?: File | null) => {
    if (!file) return;
    setTransferFile(file);
    setTransferPreview(URL.createObjectURL(file));
  };

  const handlePaid = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmittingPaid(true);
    setLoadingAction({ id: selected.id, type: 'paid' });
    try {
      let transferProofImage: string | undefined;
      if (transferFile) {
        const uploaded = await adminApi.upload('image', transferFile);
        transferProofImage = normalizeStoredMediaPath(uploaded?.url || '');
      }
      await adminApi.markWithdrawalPaid(selected.id, { transferProofImage });
      showToast(t('admin.toast.paid', { ns: 'withdrawals' }), 'success');
      resetPaidModal();
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('admin.toast.paidFailed', { ns: 'withdrawals' });
      showToast(message, 'error');
    } finally {
      setSubmittingPaid(false);
      setLoadingAction(null);
    }
  };

  const handleReject = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmittingReject(true);
    setLoadingAction({ id: selected.id, type: 'reject' });
    try {
      await adminApi.rejectWithdrawal(selected.id, rejectNotes || undefined);
      showToast(t('admin.toast.rejected', { ns: 'withdrawals' }), 'success');
      setRejectOpen(false);
      setRejectNotes('');
      setSelected(null);
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('admin.toast.rejectFailed', { ns: 'withdrawals' });
      showToast(message, 'error');
    } finally {
      setSubmittingReject(false);
      setLoadingAction(null);
    }
  };

  return (
    <div className="admin-withdrawals-page page-grid">
      <div className="reports-header">
        <PageHeader
          title={t('admin.title', { ns: 'withdrawals' })}
          subtitle={t('admin.subtitle', { ns: 'withdrawals' })}
        />
        <div className="reports-header-actions">
          <Button
            variant="outline"
            icon={<Download size={18} />}
            onClick={handleExport}
            disabled={!filteredItems.length}
          >
            {t('admin.exportExcel', { ns: 'withdrawals' })}
          </Button>
        </div>
      </div>

      <WithdrawalsSummaryCards stats={stats} />

      <WithdrawalsFiltersBar
        filters={filters}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onReset={() => setFilters(EMPTY_FILTERS)}
      />

      <WithdrawalsTable
        items={filteredItems}
        loading={loading}
        loadingAction={loadingAction}
        onDetail={(item) => { setSelected(item); setDetailOpen(true); }}
        onApprove={(item) => { setSelected(item); setConfirmApproveOpen(true); }}
        onReject={(item) => { setSelected(item); setRejectOpen(true); }}
        onConfirmTransfer={openPaidModal}
      />

      <Modal isOpen={detailOpen} title={t('admin.detail.title', { ns: 'withdrawals' })} onClose={() => { setDetailOpen(false); setSelected(null); }}>
        {selected ? (
          <div className="stack-sm withdrawal-detail wd-detail-modal">
            <div className="detail-row"><span>{t('admin.detail.requestId', { ns: 'withdrawals' })}</span><strong>#{selected.id}</strong></div>
            <div className="detail-row"><span>{t('admin.detail.instructor', { ns: 'withdrawals' })}</span><strong>{selected.instructor?.fullName}</strong></div>
            <div className="detail-row"><span>{t('admin.detail.email', { ns: 'withdrawals' })}</span><strong>{selected.instructor?.email}</strong></div>
            <div className="detail-row"><span>{t('admin.detail.payoutPhone', { ns: 'withdrawals' })}</span><strong dir="ltr">{selected.phone || empty}</strong></div>
            <div className="detail-row"><span>{t('admin.detail.transferType', { ns: 'withdrawals' })}</span><strong>{getTransferTypeLabel(String(selected.transferType || ''))}</strong></div>
            <div className="detail-row"><span>{t('admin.detail.amount', { ns: 'withdrawals' })}</span><strong>{fmtWithdrawalMoney(selected.amount)}</strong></div>
            <div className="detail-row">
              <span>{t('admin.detail.status', { ns: 'withdrawals' })}</span>
              <WithdrawalStatusBadge status={selected.status} />
            </div>
            <div className="detail-row"><span>{t('admin.detail.requestDate', { ns: 'withdrawals' })}</span><strong>{fmtWithdrawalDate(selected.createdAt)}</strong></div>
            {selected.notes ? (
              <div className="detail-row"><span>{t('admin.detail.notes', { ns: 'withdrawals' })}</span><strong>{selected.notes}</strong></div>
            ) : null}
            {selected.transferProofImage ? (
              <div className="withdrawal-proof-block">
                <strong>{t('admin.detail.transferProof', { ns: 'withdrawals' })}</strong>
                <a href={mediaUrl(selected.transferProofImage)} target="_blank" rel="noreferrer">
                  <img src={mediaUrl(selected.transferProofImage)} alt={t('admin.detail.transferProofAlt', { ns: 'withdrawals' })} className="withdrawal-proof-image" />
                </a>
              </div>
            ) : null}
            {selected.status === 'PENDING' || selected.status === 'APPROVED' ? (
              <div className="wd-detail-actions">
                <WithdrawalActionButtons
                  item={selected}
                  hideDetail
                  loadingAction={loadingAction}
                  onDetail={() => {}}
                  onApprove={(item) => { setConfirmApproveOpen(true); setSelected(item); }}
                  onReject={(item) => { setRejectOpen(true); setSelected(item); }}
                  onConfirmTransfer={openPaidModal}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={rejectOpen}
        title={t('admin.rejectModal.title', { ns: 'withdrawals' })}
        onClose={() => !submittingReject && (setRejectOpen(false), setRejectNotes(''), setSelected(null))}
      >
        <form className="stack-sm wd-reject-form" onSubmit={handleReject}>
          <p>
            {t('admin.rejectModal.message', {
              amount: fmtWithdrawalMoney(selected?.amount || 0),
              name: selected?.instructor?.fullName,
              ns: 'withdrawals',
            })}
          </p>
          <Textarea
            label={t('admin.rejectModal.reasonLabel', { ns: 'withdrawals' })}
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder={t('admin.rejectModal.reasonPlaceholder', { ns: 'withdrawals' })}
            disabled={submittingReject}
          />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => { setRejectOpen(false); setRejectNotes(''); setSelected(null); }} disabled={submittingReject}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" variant="danger" loading={submittingReject}>
              {t('admin.rejectModal.confirm', { ns: 'withdrawals' })}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={paidOpen} title={t('admin.transferModal.title', { ns: 'withdrawals' })} onClose={() => !submittingPaid && resetPaidModal()}>
        <WithdrawTransferForm
          item={selected}
          preview={transferPreview}
          submitting={submittingPaid}
          onFileSelect={handleTransferFile}
          onRemoveFile={() => {
            setTransferFile(null);
            setTransferPreview('');
          }}
          onCancel={resetPaidModal}
          onSubmit={handlePaid}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmApproveOpen}
        title={t('admin.approveDialog.title', { ns: 'withdrawals' })}
        message={t('admin.approveDialog.message', {
          amount: fmtWithdrawalMoney(selected?.amount || 0),
          name: selected?.instructor?.fullName,
          ns: 'withdrawals',
        })}
        confirmLabel={t('admin.approveDialog.confirm', { ns: 'withdrawals' })}
        onConfirm={handleApprove}
        onCancel={() => { setConfirmApproveOpen(false); setSelected(null); }}
      />
    </div>
  );
}
