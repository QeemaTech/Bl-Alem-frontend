export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED';
export type DisplayStatus = 'COMPLETED' | 'ACTIVE' | 'NOT_STARTED';

export interface MyCourseEnrollment {
  id: number;
  courseId: number;
  status: EnrollmentStatus;
  progressPercentage?: number | string;
  enrolledAt: string;
  completedAt?: string | null;
  course?: {
    titleAr?: string;
    coverImage?: string | null;
    duration?: number;
    instructor?: { fullName?: string };
    category?: { nameAr?: string };
    _count?: { lessons?: number };
    quizzes?: unknown[];
  };
  myReview?: unknown;
}

export interface MyCoursesStats {
  total: number;
  active: number;
  completed: number;
  notStarted: number;
  avgProgress: number;
  hoursLearned: number;
}
