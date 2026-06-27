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

export const withdrawalStatusVariant: Record<WithdrawalStatus, 'pending' | 'success' | 'rejected' | 'info'> = {
  PENDING: 'pending',
  APPROVED: 'info',
  PAID: 'success',
  REJECTED: 'rejected',
};
