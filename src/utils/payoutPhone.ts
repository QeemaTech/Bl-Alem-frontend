export const normalizePayoutPhone = (value: string) => String(value || '').replace(/[\s-]/g, '').trim();

export const isValidPayoutPhone = (phone: string) => (
  /^01[0125]\d{8}$/.test(phone)
  || /^\+201[0125]\d{8}$/.test(phone)
);
