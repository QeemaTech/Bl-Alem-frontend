import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, Table2 } from '@/icons';
import { useAdminWithdrawalLabels } from '../../../hooks/useAdminWithdrawalLabels';
import { formatNumber } from '../../../utils/localeFormat';
import { Card } from '../../ui/Card';
import { Table } from '../../ui/Table';
import { WithdrawalActionButtons } from './WithdrawalActionButtons';
import { WithdrawalStatusBadge } from './WithdrawalStatusBadge';
import type { WithdrawalActionType, WithdrawalItem } from './types';

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
  const { t, i18n } = useTranslation(['withdrawals', 'common']);
  const { fmtWithdrawalDate, fmtWithdrawalMoney, empty } = useAdminWithdrawalLabels();

  const columns = useMemo(() => {
    const cols = t('admin.table.columns', { returnObjects: true, ns: 'withdrawals' }) as Record<string, string>;
    return [
      { key: 'id', header: cols.id, width: '6.5rem', align: 'center' as const },
      { key: 'instructorName', header: cols.instructor, width: '16%' },
      {
        key: 'instructorEmail',
        header: cols.email,
        width: '16%',
        truncate: true,
        hideOnMobile: true,
      },
      {
        key: 'amountLabel',
        header: cols.amount,
        width: '11%',
        align: 'center' as const,
        render: (row: { amountLabel: string }) => (
          <span className="withdrawal-amount-cell">
            <Banknote size={16} aria-hidden="true" />
            <strong>{row.amountLabel}</strong>
          </span>
        ),
      },
      {
        key: 'status',
        header: cols.status,
        width: '10.5rem',
        minWidth: '10.5rem',
        align: 'center' as const,
        truncate: false,
        className: 'wd-col-status',
        render: (row: { _raw: WithdrawalItem }) => <WithdrawalStatusBadge status={String(row._raw.status)} />,
      },
      { key: 'dateLabel', header: cols.date, width: '15%' },
      {
        key: 'actions',
        header: cols.actions,
        width: '32%',
        wrap: true,
        truncate: false,
        render: (row: { _raw: WithdrawalItem }) => (
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
    ];
  }, [t, loadingAction, onDetail, onApprove, onReject, onConfirmTransfer]);

  const rows = useMemo(() => items.map((item) => ({
    ...item,
    instructorName: item.instructor?.fullName || empty,
    instructorEmail: item.instructor?.email || empty,
    amountLabel: fmtWithdrawalMoney(item.amount),
    dateLabel: fmtWithdrawalDate(item.createdAt),
    _raw: item,
  })), [items, empty, fmtWithdrawalMoney, fmtWithdrawalDate]);

  const recordCount = t('common:table.recordCount', {
    count: formatNumber(items.length, undefined, i18n.language),
  });

  return (
    <Card className="reports-table-card">
      <div className="section-heading reports-table-head">
        <h2>
          <span className="reports-table-title-icon" aria-hidden="true">
            <Table2 size={20} />
          </span>
          {t('admin.table.title', { ns: 'withdrawals' })}
        </h2>
        <span className="muted-count">{recordCount}</span>
      </div>
      <Table
        loading={loading}
        stickyHeader
        compact
        fluid
        hideScrollNotice
        maxHeight="min(72vh, 760px)"
        emptyTitle={t('admin.table.emptyTitle', { ns: 'withdrawals' })}
        emptyDescription={t('admin.table.emptyDescription', { ns: 'withdrawals' })}
        data={rows}
        columns={columns}
      />
    </Card>
  );
}
