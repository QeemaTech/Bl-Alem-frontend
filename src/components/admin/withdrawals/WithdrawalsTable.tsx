import { Banknote } from 'lucide-react';
import { Table } from '../../ui/Table';
import { WithdrawalActionButtons } from './WithdrawalActionButtons';
import { WithdrawalStatusBadge } from './WithdrawalStatusBadge';
import {
  fmtWithdrawalDate,
  fmtWithdrawalMoney,
  type WithdrawalActionType,
  type WithdrawalItem,
} from './types';

interface WithdrawalsTableProps {
  items: WithdrawalItem[];
  loading?: boolean;
  loadingAction?: { id: number; type: WithdrawalActionType } | null;
  onDetail: (item: WithdrawalItem) => void;
  onApprove: (item: WithdrawalItem) => void;
  onReject: (item: WithdrawalItem) => void;
  onConfirmTransfer: (item: WithdrawalItem) => void;
}

export function WithdrawalsTable({
  items,
  loading,
  loadingAction,
  onDetail,
  onApprove,
  onReject,
  onConfirmTransfer,
}: WithdrawalsTableProps) {
  const rows = items.map((item) => ({
    ...item,
    instructorName: item.instructor?.fullName || '—',
    instructorEmail: item.instructor?.email || '—',
    amountLabel: fmtWithdrawalMoney(item.amount),
    dateLabel: fmtWithdrawalDate(item.createdAt),
    _raw: item,
  }));

  return (
    <div className="wd-table-card">
      <Table
        className="wd-data-grid"
        loading={loading}
        stickyHeader
        compact
        fluid
        hideScrollNotice
        maxHeight="min(72vh, 760px)"
        emptyTitle="لا توجد طلبات سحب"
        emptyDescription="لم يتم إرسال أي طلبات سحب من المحاضرين بعد، أو لا توجد نتائج مطابقة للفلاتر."
        data={rows}
        columns={[
          { key: 'id', header: 'رقم الطلب', width: '6.5rem', className: 'wd-col-id', align: 'center' },
          { key: 'instructorName', header: 'المحاضر', width: '16%' },
          {
            key: 'instructorEmail',
            header: 'البريد',
            width: '16%',
            truncate: true,
            className: 'wd-col-email',
            hideOnMobile: true,
          },
          {
            key: 'amountLabel',
            header: 'المبلغ',
            width: '11%',
            render: (row) => (
              <span className="wd-amount-cell">
                <Banknote size={14} aria-hidden="true" />
                <strong>{row.amountLabel}</strong>
              </span>
            ),
          },
          {
            key: 'status',
            header: 'الحالة',
            width: '11%',
            align: 'center',
            render: (row) => <WithdrawalStatusBadge status={String(row._raw.status)} />,
          },
          { key: 'dateLabel', header: 'التاريخ', width: '15%', className: 'wd-col-date' },
          {
            key: 'actions',
            header: 'الإجراءات',
            width: '32%',
            className: 'wd-col-actions',
            wrap: true,
            truncate: false,
            render: (row) => (
              <WithdrawalActionButtons
                item={row._raw}
                loadingAction={loadingAction}
                onDetail={onDetail}
                onApprove={onApprove}
                onReject={onReject}
                onConfirmTransfer={onConfirmTransfer}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
