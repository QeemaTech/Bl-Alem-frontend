import type { DisplayStatus, MyCourseEnrollment, MyCoursesStats } from './types';

export const STATUS_VARIANT = (status: DisplayStatus) => {
  if (status === 'COMPLETED') return 'success' as const;
  if (status === 'NOT_STARTED') return 'warning' as const;
  return 'info' as const;
};

export const getDisplayStatus = (item: MyCourseEnrollment): DisplayStatus => {
  const progress = Number(item.progressPercentage || 0);
  if (item.status === 'COMPLETED' || progress >= 100) return 'COMPLETED';
  if (progress <= 0) return 'NOT_STARTED';
  return 'ACTIVE';
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
