export const fmtNum = (value: number) =>
  Number(value || 0).toLocaleString('ar-SA');

export const fmtMoney = (value: number, currency = 'ج.م') =>
  `${fmtNum(Math.round(value))} ${currency}`;

export const fmtPct = (value: number, signed = true) => {
  const n = Number(value || 0);
  const prefix = signed && n > 0 ? '+' : '';
  return `${prefix}${n.toFixed(1)}%`;
};

export const fmtDateAr = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const fmtTimeAgo = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} ي`;
  return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
};

export const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
