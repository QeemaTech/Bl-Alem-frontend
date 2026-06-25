export const typeLabels: Record<string, string> = {
  WELCOME: 'ترحيب',
  LIVE_SESSION: 'جلسة مباشرة',
  CERTIFICATE: 'شهادة',
  REWARD: 'مكافأة',
  PAYMENT: 'دفع',
  COMMUNITY: 'مجتمع',
  SUBSCRIPTION: 'اشتراك',
  EARNING: 'أرباح',
  REVIEW: 'تقييم',
  WITHDRAWAL: 'سحب',
  COURSE: 'كورس',
  INSTRUCTOR_REQUEST: 'طلب محاضر',
  COURSE_REVIEW: 'مراجعة كورس',
  SUPPORT: 'دعم فني',
  ADMIN: 'إداري',
};

export const roleLabels: Record<string, string> = {
  STUDENT: 'طالب',
  INSTRUCTOR: 'محاضر',
  SUPER_ADMIN: 'مشرف',
};

export const fmtNotificationDate = (value: string) => new Date(value).toLocaleDateString('ar-SA', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
