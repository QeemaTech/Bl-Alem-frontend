import { CheckCircle2, Eye, Upload, XCircle } from 'lucide-react';
import type { WithdrawalActionType, WithdrawalItem } from './types';

interface WithdrawalActionButtonsProps {
  item: WithdrawalItem;
  loadingAction?: { id: number; type: WithdrawalActionType } | null;
  hideDetail?: boolean;
  onDetail: (item: WithdrawalItem) => void;
  onApprove: (item: WithdrawalItem) => void;
  onReject: (item: WithdrawalItem) => void;
  onConfirmTransfer: (item: WithdrawalItem) => void;
}

function isLoading(
  loadingAction: WithdrawalActionButtonsProps['loadingAction'],
  itemId: number,
  type: WithdrawalActionType,
) {
  return loadingAction?.id === itemId && loadingAction?.type === type;
}

export function WithdrawalActionButtons({
  item,
  loadingAction,
  hideDetail = false,
  onDetail,
  onApprove,
  onReject,
  onConfirmTransfer,
}: WithdrawalActionButtonsProps) {
  return (
    <div className="wd-row-actions">
      {!hideDetail ? (
        <button
          type="button"
          className="wd-btn wd-btn-outline"
          onClick={() => onDetail(item)}
          disabled={Boolean(loadingAction)}
        >
          <Eye size={15} aria-hidden="true" />
          <span>التفاصيل</span>
        </button>
      ) : null}

      {item.status === 'PENDING' ? (
        <>
          <button
            type="button"
            className="wd-btn wd-btn-primary"
            onClick={() => onApprove(item)}
            disabled={Boolean(loadingAction)}
          >
            {isLoading(loadingAction, item.id, 'approve') ? (
              <span className="wd-btn-spinner" aria-hidden="true" />
            ) : (
              <CheckCircle2 size={15} aria-hidden="true" />
            )}
            <span>اعتماد</span>
          </button>
          <button
            type="button"
            className="wd-btn wd-btn-danger"
            onClick={() => onReject(item)}
            disabled={Boolean(loadingAction)}
          >
            <XCircle size={15} aria-hidden="true" />
            <span>رفض</span>
          </button>
        </>
      ) : null}

      {item.status === 'APPROVED' ? (
        <>
          <button
            type="button"
            className="wd-btn wd-btn-primary"
            onClick={() => onConfirmTransfer(item)}
            disabled={Boolean(loadingAction)}
          >
            <Upload size={15} aria-hidden="true" />
            <span>تأكيد التحويل</span>
          </button>
          <button
            type="button"
            className="wd-btn wd-btn-danger"
            onClick={() => onReject(item)}
            disabled={Boolean(loadingAction)}
          >
            <XCircle size={15} aria-hidden="true" />
            <span>رفض</span>
          </button>
        </>
      ) : null}
    </div>
  );
}
