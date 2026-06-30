export const WITHDRAWAL_TRANSFER_TYPES = [
  'VODAFONE_CASH',
  'INSTAPAY',
  'ORANGE_CASH',
  'ETISALAT_CASH',
  'BANK_WALLET',
  'OTHER',
] as const;

export type WithdrawalTransferType = typeof WITHDRAWAL_TRANSFER_TYPES[number];
