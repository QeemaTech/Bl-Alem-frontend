export const statusVariant = (status: string) => {
  if (status === 'PUBLISHED') return 'published' as const;
  if (status === 'PENDING_REVIEW') return 'pending' as const;
  if (status === 'APPROVED') return 'success' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  if (status === 'SUSPENDED') return 'suspended' as const;
  if (status === 'DRAFT') return 'info' as const;
  return 'default' as const;
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
export const canRejectCourse = (status: string) => status === 'PENDING_REVIEW';
export const canSuspendCourse = (status: string) => ['PUBLISHED', 'APPROVED'].includes(status);
