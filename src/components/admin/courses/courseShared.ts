export const statusLabels: Record<string, string> = {
  DRAFT: 'مسودة',
  PENDING_REVIEW: 'قيد المراجعة',
  APPROVED: 'معتمد',
  PUBLISHED: 'منشور',
  REJECTED: 'مرفوض',
  SUSPENDED: 'موقوف',
};

export const levelLabels: Record<string, string> = {
  BEGINNER: 'مبتدئ',
  INTERMEDIATE: 'متوسط',
  ADVANCED: 'متقدم',
};

export const typeLabels: Record<string, string> = {
  RECORDED: 'مسجل',
  LIVE: 'مباشر',
  MIXED: 'مختلط',
};

export const statusVariant = (status: string) => {
  if (status === 'PUBLISHED') return 'published' as const;
  if (status === 'PENDING_REVIEW') return 'pending' as const;
  if (status === 'APPROVED') return 'success' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  if (status === 'SUSPENDED') return 'suspended' as const;
  if (status === 'DRAFT') return 'info' as const;
  return 'default' as const;
};

export const fmtMoney = (course: any) => {
  const price = Number(course?.discountPrice ?? course?.price ?? 0);
  if (!price) return 'مجاني';
  return `${price.toLocaleString('ar-SA')} ج.م`;
};

export const fmtCourseDate = (value?: string | null, withTime = false) => (value
  ? new Date(value).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
  : '—');

export const fmtDuration = (seconds: number) => {
  const mins = Math.round(Number(seconds || 0) / 60);
  return mins ? `${mins} دقيقة` : '—';
};

export const getCourseStats = (course: any) => {
  const lessons = course.sections?.reduce(
    (sum: number, s: any) => sum + (s.lessons?.length || 0),
    0,
  ) ?? course._count?.lessons ?? 0;
  return {
    sections: course.sections?.length || 0,
    lessons,
    quizzes: course.quizzes?.length || 0,
    students: course.totalStudents ?? course._count?.enrollments ?? 0,
    reviews: course._count?.reviews ?? course.reviews?.length ?? 0,
    rating: Number(course.ratingAverage || 0).toFixed(1),
  };
};

export const canApproveCourse = (status: string) => status === 'PENDING_REVIEW';
export const canPublishCourse = (status: string) => ['APPROVED', 'SUSPENDED'].includes(status);
export const canRejectCourse = (status: string) => ['PENDING_REVIEW', 'APPROVED'].includes(status);
export const canSuspendCourse = (status: string) => ['PUBLISHED', 'APPROVED'].includes(status);
