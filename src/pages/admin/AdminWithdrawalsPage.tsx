import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Upload, Wallet } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { WithdrawalActionButtons } from '../../components/admin/withdrawals/WithdrawalActionButtons';
import { WithdrawalStatusBadge } from '../../components/admin/withdrawals/WithdrawalStatusBadge';
import { WithdrawalsFiltersBar, type WithdrawalsFilters } from '../../components/admin/withdrawals/WithdrawalsFiltersBar';
import { WithdrawalsSummaryCards } from '../../components/admin/withdrawals/WithdrawalsSummaryCards';
import { WithdrawalsTable } from '../../components/admin/withdrawals/WithdrawalsTable';
import {
  fmtWithdrawalDate,
  fmtWithdrawalMoney,
  WITHDRAWAL_STATUS_LABELS,
  type WithdrawalActionType,
  type WithdrawalItem,
} from '../../components/admin/withdrawals/types';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';
import { mediaUrl, normalizeStoredMediaPath } from '../../utils/mediaUrl';

const EMPTY_FILTERS: WithdrawalsFilters = {
  status: '',
  dateFrom: '',
  dateTo: '',
};

const exportColumns = [
  { key: 'id', header: 'رقم الطلب' },
  { key: 'instructor', header: 'المحاضر' },
  { key: 'email', header: 'البريد' },
  { key: 'amount', header: 'المبلغ (ر.س)' },
  { key: 'bankName', header: 'البنك' },
  { key: 'accountName', header: 'اسم الحساب' },
  { key: 'iban', header: 'IBAN' },
  { key: 'status', header: 'الحالة' },
  { key: 'createdAt', header: 'تاريخ الطلب' },
  { key: 'notes', header: 'ملاحظات' },
];

export default function AdminWithdrawalsPage() {
  const { showToast } = useToast();
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
  const transferInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await adminApi.withdrawals());
    } catch {
      showToast('تعذّر تحميل طلبات السحب.', 'error');
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
    exportTableToExcel('السحوبات', exportColumns, filteredItems.map((row) => ({
      id: row.id,
      instructor: row.instructor?.fullName || '—',
      email: row.instructor?.email || '—',
      amount: fmtWithdrawalMoney(row.amount),
      bankName: row.bankName || '—',
      accountName: row.accountName || '—',
      iban: row.iban || '—',
      status: WITHDRAWAL_STATUS_LABELS[row.status as keyof typeof WITHDRAWAL_STATUS_LABELS] || row.status,
      createdAt: fmtWithdrawalDate(row.createdAt),
      notes: row.notes || '—',
    })));
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
      showToast('تم اعتماد طلب السحب. يمكنك الآن تأكيد التحويل.', 'success');
      setConfirmApproveOpen(false);
      const refreshed = await adminApi.withdrawals();
      setItems(refreshed);
      const approvedItem = refreshed.find((item: WithdrawalItem) => item.id === approvedId);
      if (approvedItem) openPaidModal(approvedItem);
      else setSelected(null);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || 'تعذّر اعتماد الطلب.';
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
      showToast('تم تأكيد الدفع للمحاضر.', 'success');
      resetPaidModal();
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || 'تعذّر تأكيد الدفع.';
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
      showToast('تم رفض طلب السحب.', 'success');
      setRejectOpen(false);
      setRejectNotes('');
      setSelected(null);
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || 'تعذّر رفض الطلب.';
      showToast(message, 'error');
    } finally {
      setSubmittingReject(false);
      setLoadingAction(null);
    }
  };

  return (
    <div className="admin-withdrawals-page page-grid">
      <header className="wd-page-header">
        <PageHeader
          title="إدارة السحوبات"
          subtitle="مراجعة واعتماد طلبات سحب أرباح المحاضرين بأمان ووضوح"
        />
        <div className="wd-page-header-badge" aria-hidden="true">
          <Wallet size={20} />
        </div>
      </header>

      <WithdrawalsSummaryCards stats={stats} />

      <WithdrawalsFiltersBar
        filters={filters}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onReset={() => setFilters(EMPTY_FILTERS)}
        onExport={handleExport}
        exportDisabled={!filteredItems.length}
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

      <Modal isOpen={detailOpen} title="تفاصيل طلب السحب" onClose={() => { setDetailOpen(false); setSelected(null); }}>
        {selected ? (
          <div className="stack-sm withdrawal-detail wd-detail-modal">
            <div className="detail-row"><span>رقم الطلب</span><strong>#{selected.id}</strong></div>
            <div className="detail-row"><span>المحاضر</span><strong>{selected.instructor?.fullName}</strong></div>
            <div className="detail-row"><span>البريد</span><strong>{selected.instructor?.email}</strong></div>
            <div className="detail-row"><span>الهاتف</span><strong>{selected.instructor?.phone || '—'}</strong></div>
            <div className="detail-row"><span>المبلغ</span><strong>{fmtWithdrawalMoney(selected.amount)}</strong></div>
            <div className="detail-row"><span>البنك</span><strong>{selected.bankName || '—'}</strong></div>
            <div className="detail-row"><span>اسم الحساب</span><strong>{selected.accountName || '—'}</strong></div>
            <div className="detail-row"><span>IBAN</span><strong dir="ltr">{selected.iban || '—'}</strong></div>
            <div className="detail-row">
              <span>الحالة</span>
              <WithdrawalStatusBadge status={selected.status} />
            </div>
            <div className="detail-row"><span>تاريخ الطلب</span><strong>{fmtWithdrawalDate(selected.createdAt)}</strong></div>
            {selected.notes ? (
              <div className="detail-row"><span>ملاحظات</span><strong>{selected.notes}</strong></div>
            ) : null}
            {selected.transferProofImage ? (
              <div className="withdrawal-proof-block">
                <strong>صورة التحويل</strong>
                <a href={mediaUrl(selected.transferProofImage)} target="_blank" rel="noreferrer">
                  <img src={mediaUrl(selected.transferProofImage)} alt="صورة التحويل" className="withdrawal-proof-image" />
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
        title="تأكيد رفض طلب السحب"
        onClose={() => !submittingReject && (setRejectOpen(false), setRejectNotes(''), setSelected(null))}
      >
        <form className="stack-sm wd-reject-form" onSubmit={handleReject}>
          <p>
            هل أنت متأكد من رفض طلب سحب بمبلغ{' '}
            <strong>{fmtWithdrawalMoney(selected?.amount || 0)}</strong> للمحاضر{' '}
            <strong>{selected?.instructor?.fullName}</strong>؟
          </p>
          <Textarea
            label="سبب الرفض (اختياري)"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="اكتب سبب الرفض ليظهر للمحاضر..."
            disabled={submittingReject}
          />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => { setRejectOpen(false); setRejectNotes(''); setSelected(null); }} disabled={submittingReject}>
              إلغاء
            </Button>
            <Button type="submit" variant="danger" loading={submittingReject}>
              تأكيد الرفض
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={paidOpen} title="تأكيد التحويل" onClose={() => !submittingPaid && resetPaidModal()}>
        <form className="stack-sm withdraw-paid-form" onSubmit={handlePaid}>
          <p>
            أكّد تحويل مبلغ{' '}
            <strong>{fmtWithdrawalMoney(selected?.amount || 0)}</strong>{' '}
            إلى المحاضر <strong>{selected?.instructor?.fullName}</strong>.
          </p>
          <div className="withdraw-transfer-upload">
            <input
              ref={transferInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleTransferFile(e.target.files?.[0])}
            />
            {transferPreview ? (
              <div className="withdraw-transfer-preview">
                <img src={transferPreview} alt="معاينة صورة التحويل" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTransferFile(null);
                    setTransferPreview('');
                    if (transferInputRef.current) transferInputRef.current.value = '';
                  }}
                >
                  إزالة الصورة
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="withdraw-transfer-dropzone"
                onClick={() => transferInputRef.current?.click()}
              >
                <ImagePlus size={28} />
                <span>إرفاق صورة التحويل (اختياري)</span>
                <small>PNG أو JPG — يمكنك التأكيد بدون صورة</small>
              </button>
            )}
            {!transferPreview ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Upload size={14} />}
                onClick={() => transferInputRef.current?.click()}
              >
                اختيار صورة
              </Button>
            ) : null}
          </div>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={resetPaidModal} disabled={submittingPaid}>
              إلغاء
            </Button>
            <Button type="submit" loading={submittingPaid}>
              تأكيد الدفع
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmApproveOpen}
        title="اعتماد طلب السحب"
        message={`هل تريد اعتماد طلب سحب بمبلغ ${fmtWithdrawalMoney(selected?.amount || 0)} للمحاضر ${selected?.instructor?.fullName}؟ سيتم خصم المبلغ من رصيده المتاح.`}
        confirmLabel="اعتماد"
        onConfirm={handleApprove}
        onCancel={() => { setConfirmApproveOpen(false); setSelected(null); }}
      />
    </div>
  );
}
