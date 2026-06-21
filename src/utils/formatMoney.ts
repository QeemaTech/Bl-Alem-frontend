/** Format monetary values without floating-point display glitches. */
export function formatMoney(value: number | string | null | undefined, currency = 'ر.س') {
  const num = Math.round(Number(value || 0) * 100) / 100;
  return `${num.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function roundMoney(value: number | string | null | undefined) {
  return Math.round(Number(value || 0) * 100) / 100;
}
