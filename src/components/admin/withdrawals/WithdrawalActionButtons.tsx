import { CheckCircle2, Eye, Upload, XCircle } from '@/icons';
import { Button } from '../../ui/Button';
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
  const busy = Boolean(loadingAction);

  return (
    <div className="table-actions withdrawal-row-actions">
      {!hideDetail ? (
        <Button
          variant="outline"
          size="sm"
          icon={<Eye size={16} />}
          onClick={() => onDetail(item)}
          disabled={busy}
        >
          التفاصيل
        </Button>
      ) : null}

      {item.status === 'PENDING' ? (
        <>
          <Button
            variant="primary"
            size="sm"
            icon={<CheckCircle2 size={16} />}
            loading={isLoading(loadingAction, item.id, 'approve')}
            onClick={() => onApprove(item)}
            disabled={busy && !isLoading(loadingAction, item.id, 'approve')}
          >
            اعتماد
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<XCircle size={16} />}
            onClick={() => onReject(item)}
            disabled={busy}
          >
            رفض
          </Button>
        </>
      ) : null}

      {item.status === 'APPROVED' ? (
        <>
          <Button
            variant="primary"
            size="sm"
            icon={<Upload size={16} />}
            loading={isLoading(loadingAction, item.id, 'paid')}
            onClick={() => onConfirmTransfer(item)}
            disabled={busy && !isLoading(loadingAction, item.id, 'paid')}
          >
            تأكيد التحويل
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<XCircle size={16} />}
            onClick={() => onReject(item)}
            disabled={busy}
          >
            رفض
          </Button>
        </>
      ) : null}
    </div>
  );
}
