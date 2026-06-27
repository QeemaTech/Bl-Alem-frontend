import { apiClient } from './client';
import type { ApiResponse } from '../utils/types';

const unwrap = async <T>(request: Promise<{ data: ApiResponse<T> }>) => {
  const { data } = await request;
  return data.data;
};

export const studentApi = {
  dashboard: () => unwrap<any>(apiClient.get('/student/dashboard')),
  categories: () => unwrap<any[]>(apiClient.get('/student/categories')),
  courses: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/student/courses', { params })),
  courseDetails: (id: string | number) => unwrap<any>(apiClient.get(`/student/courses/${id}`)),
  checkout: (courseId: string | number, payload: { couponCode?: string; pointsToUse?: number; gateway?: string }) => unwrap<any>(apiClient.post(`/student/courses/${courseId}/checkout`, payload)),
  payments: () => unwrap<any[]>(apiClient.get('/student/payments')),
  validateCoupon: (payload: { code: string; courseId: number }) => unwrap<any>(apiClient.post('/student/coupons/validate', payload)),
  myCourses: (status = 'all') => unwrap<any[]>(apiClient.get('/student/my-courses', { params: { status } })),
  player: (courseId: string | number) => unwrap<any>(apiClient.get(`/student/courses/${courseId}/player`)),
  updateLessonProgress: (lessonId: string | number, watchedSeconds: number) => unwrap<any>(apiClient.post(`/student/lessons/${lessonId}/progress`, { watchedSeconds })),
  completeLesson: (lessonId: string | number) => unwrap<any>(apiClient.post(`/student/lessons/${lessonId}/complete`)),
  courseQuizzes: (courseId: string | number) => unwrap<any[]>(apiClient.get(`/student/courses/${courseId}/quizzes`)),
  quiz: (quizId: string | number) => unwrap<any>(apiClient.get(`/student/quizzes/${quizId}`)),
  startQuiz: (quizId: string | number) => unwrap<any>(apiClient.post(`/student/quizzes/${quizId}/start`)),
  submitQuiz: (quizId: string | number, answers: { questionId: number; answerId: number }[]) => unwrap<any>(apiClient.post(`/student/quizzes/${quizId}/submit`, { answers })),
  liveSessions: () => unwrap<any>(apiClient.get('/student/live-sessions')),
  joinLiveSession: (id: string | number) => unwrap<any>(apiClient.get(`/student/live-sessions/${id}/join`)),
  createReview: (courseId: string | number, payload: { rating: number; comment?: string }) => unwrap<any>(apiClient.post(`/student/courses/${courseId}/reviews`, payload)),
  reviews: (courseId: string | number) => unwrap<any[]>(apiClient.get(`/student/courses/${courseId}/reviews`)),
  certificates: () => unwrap<any[]>(apiClient.get('/student/certificates')),
  certificate: (id: string | number) => unwrap<any>(apiClient.get(`/student/certificates/${id}`)),
  rewards: () => unwrap<any>(apiClient.get('/student/rewards')),
  wallet: () => unwrap<any>(apiClient.get('/student/wallet')),
  learningPaths: () => unwrap<any[]>(apiClient.get('/student/learning-paths')),
  learningPath: (id: string | number) => unwrap<any>(apiClient.get(`/student/learning-paths/${id}`)),
  enrollLearningPath: (id: string | number, payload?: { gateway?: string }) => unwrap<any>(apiClient.post(`/student/learning-paths/${id}/enroll`, payload || {})),
  communityPosts: () => unwrap<any[]>(apiClient.get('/student/community/posts')),
  createCommunityPost: (payload: { titleAr: string; bodyAr: string }) => unwrap<any>(apiClient.post('/student/community/posts', payload)),
  createCommunityComment: (postId: string | number, bodyAr: string) => unwrap<any>(apiClient.post(`/student/community/posts/${postId}/comments`, { bodyAr })),
  pricingPlans: () => unwrap<any>(apiClient.get('/student/pricing-plans')),
  subscribePlan: (planId: string | number, payload?: { gateway?: string }) => unwrap<any>(apiClient.post(`/student/pricing-plans/${planId}/subscribe`, payload || {})),
  applyReferral: (code: string) => unwrap<any>(apiClient.post('/student/referrals/apply', { code })),
  notifications: () => unwrap<any[]>(apiClient.get('/student/notifications')),
  markNotificationRead: (id: string | number) => unwrap<any>(apiClient.patch(`/student/notifications/${id}/read`)),
  supportTickets: () => unwrap<any[]>(apiClient.get('/student/support-tickets')),
  createSupportTicket: (payload: { subject: string; message: string }) => unwrap<any>(apiClient.post('/student/support-tickets', payload)),
  supportTicket: (id: string | number) => unwrap<any>(apiClient.get(`/student/support-tickets/${id}`)),
  replySupportTicket: (id: string | number, message: string) => unwrap<any>(apiClient.post(`/student/support-tickets/${id}/reply`, { message })),
  profile: () => unwrap<any>(apiClient.get('/student/profile')),
  updateProfile: (payload: Record<string, unknown>) => unwrap<any>(apiClient.put('/student/profile', payload)),
  changePassword: (payload: { currentPassword: string; newPassword: string }) => unwrap<any>(apiClient.put('/student/change-password', payload)),
  upload: (kind: 'image' | 'video' | 'file', file: File) => {
    const form = new FormData();
    form.append('file', file);
    return unwrap<any>(apiClient.post(`/uploads/${kind}`, form));
  },
};
