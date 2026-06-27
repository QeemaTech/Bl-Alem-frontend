import type { DisplayStatus, MyCourseEnrollment, MyCoursesStats } from './types';

export const STATUS_LABELS: Record<DisplayStatus, string> = {
  COMPLETED: 'مكتمل',
  ACTIVE: 'قيد التعلم',
  NOT_STARTED: 'لم يبدأ',
};

export const STATUS_VARIANT = (status: DisplayStatus) => {
  if (status === 'COMPLETED') return 'success' as const;
  if (status === 'NOT_STARTED') return 'warning' as const;
  return 'info' as const;
};

export const fmtDate = (value?: string | null) => (value
  ? new Date(value).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
  : '—');

export const getDisplayStatus = (item: MyCourseEnrollment): DisplayStatus => {
  const progress = Number(item.progressPercentage || 0);
  if (item.status === 'COMPLETED' || progress >= 100) return 'COMPLETED';
  if (progress <= 0) return 'NOT_STARTED';
  return 'ACTIVE';
};

export const formatDuration = (minutes?: number) => {
  const total = Number(minutes || 0);
  if (!total) return null;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours && mins) return `${hours} س ${mins} د`;
  if (hours) return `${hours} ساعة`;
  return `${mins} دقيقة`;
};

export const computeStats = (items: MyCourseEnrollment[]): MyCoursesStats => {
  let active = 0;
  let completed = 0;
  let notStarted = 0;
  let progressSum = 0;
  let learnedMinutes = 0;

  items.forEach((item) => {
    const display = getDisplayStatus(item);
    const progress = Number(item.progressPercentage || 0);
    progressSum += progress;
    learnedMinutes += Number(item.course?.duration || 0) * (progress / 100);

    if (display === 'COMPLETED') completed += 1;
    else if (display === 'NOT_STARTED') notStarted += 1;
    else active += 1;
  });

  return {
    total: items.length,
    active,
    completed,
    notStarted,
    avgProgress: items.length ? Math.round(progressSum / items.length) : 0,
    hoursLearned: Math.round((learnedMinutes / 60) * 10) / 10,
  };
};

export const getJourneyMessage = (stats: MyCoursesStats) => {
  if (!stats.total) return 'ابدأ رحلتك بالاشتراك في دورة من الكورسات المتاحة.';
  if (stats.avgProgress >= 100) return 'ممتاز! أكملت جميع دوراتك المسجّلة.';
  if (stats.avgProgress >= 50) return 'أنت في منتصف الطريق — استمر في التعلّم!';
  return 'بداية قوية — كل درس يقربك من هدفك.';
};
