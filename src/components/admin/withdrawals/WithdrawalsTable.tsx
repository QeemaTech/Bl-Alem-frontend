import { Banknote, Table2 } from '@/icons';
import { Card } from '../../ui/Card';
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
    <Card className="reports-table-card">
      <div className="section-heading reports-table-head">
        <h2>
          <span className="reports-table-title-icon" aria-hidden="true">
            <Table2 size={20} />
          </span>
          طلبات السحب
        </h2>
        <span className="muted-count">{items.length.toLocaleString('ar-EG')} سجل</span>
      </div>
      <Table
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
          { key: 'id', header: 'رقم الطلب', width: '6.5rem', align: 'center' },
          { key: 'instructorName', header: 'المحاضر', width: '16%' },
          {
            key: 'instructorEmail',
            header: 'البريد',
            width: '16%',
            truncate: true,
            hideOnMobile: true,
          },
          {
            key: 'amountLabel',
            header: 'المبلغ',
            width: '11%',
            align: 'center',
            render: (row) => (
              <span className="withdrawal-amount-cell">
                <Banknote size={16} aria-hidden="true" />
                <strong>{row.amountLabel}</strong>
              </span>
            ),
          },
          {
            key: 'status',
            header: 'الحالة',
            width: '10.5rem',
            minWidth: '10.5rem',
            align: 'center',
            truncate: false,
            className: 'wd-col-status',
            render: (row) => <WithdrawalStatusBadge status={String(row._raw.status)} />,
          },
          { key: 'dateLabel', header: 'التاريخ', width: '15%' },
          {
            key: 'actions',
            header: 'الإجراءات',
            width: '32%',
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
    </Card>
  );
}
