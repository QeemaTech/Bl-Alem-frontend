export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

export type WithdrawalActionType = 'approve' | 'reject' | 'paid' | 'detail';

export interface WithdrawalItem {
  id: number;
  amount: number | string;
  status: WithdrawalStatus;
  bankName?: string | null;
  accountName?: string | null;
  iban?: string | null;
  notes?: string | null;
  transferProofImage?: string | null;
  createdAt: string;
  instructor?: {
    id?: number;
    fullName?: string;
    email?: string;
    phone?: string;
  };
}

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  PENDING: 'قيد المراجعة',
  APPROVED: 'معتمد',
  PAID: 'مدفوع',
  REJECTED: 'مرفوض',
};

export const fmtWithdrawalDate = (value: string) => new Date(value).toLocaleDateString('ar-SA', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const fmtWithdrawalMoney = (value: number | string) => (
  `${Number(value || 0).toLocaleString('ar-SA')} ر.س`
);
