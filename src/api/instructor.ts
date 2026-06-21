import { apiClient } from './client';
import type { ApiResponse } from '../utils/types';

const unwrap = async <T>(request: Promise<{ data: ApiResponse<T> }>) => {
  const { data } = await request;
  return data.data;
};

export const instructorApi = {
  dashboard: () => unwrap<any>(apiClient.get('/instructor/dashboard')),
  categories: () => unwrap<any[]>(apiClient.get('/instructor/categories')),
  profile: () => unwrap<any>(apiClient.get('/instructor/profile')),
  updateProfile: (payload: Record<string, unknown>) => unwrap<any>(apiClient.put('/instructor/profile', payload)),
  resubmitProfile: () => unwrap<any>(apiClient.post('/instructor/profile/resubmit')),
  courses: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/instructor/courses', { params })),
  course: (id: string | number) => unwrap<any>(apiClient.get(`/instructor/courses/${id}`)),
  createCourse: (payload: Record<string, unknown>) => unwrap<any>(apiClient.post('/instructor/courses', payload)),
  updateCourse: (id: string | number, payload: Record<string, unknown>) => unwrap<any>(apiClient.put(`/instructor/courses/${id}`, payload)),
  deleteCourse: (id: string | number) => unwrap<any>(apiClient.delete(`/instructor/courses/${id}`)),
  submitCourseReview: (id: string | number) => unwrap<any>(apiClient.post(`/instructor/courses/${id}/submit-review`)),
  createSection: (courseId: string | number, payload: Record<string, unknown>) => unwrap<any>(apiClient.post(`/instructor/courses/${courseId}/sections`, payload)),
  updateSection: (id: string | number, payload: Record<string, unknown>) => unwrap<any>(apiClient.put(`/instructor/sections/${id}`, payload)),
  deleteSection: (id: string | number) => unwrap<any>(apiClient.delete(`/instructor/sections/${id}`)),
  reorderSections: (courseId: string | number, sections: { id: number; order: number }[]) => unwrap<any>(apiClient.put(`/instructor/courses/${courseId}/sections/reorder`, { sections })),
  reorderLessons: (courseId: string | number, lessons: { id: number; order: number; sectionId?: number }[]) => unwrap<any>(apiClient.put(`/instructor/courses/${courseId}/lessons/reorder`, { lessons })),
  createLesson: (courseId: string | number, payload: Record<string, unknown>) => unwrap<any>(apiClient.post(`/instructor/courses/${courseId}/lessons`, payload)),
  updateLesson: (id: string | number, payload: Record<string, unknown>) => unwrap<any>(apiClient.put(`/instructor/lessons/${id}`, payload)),
  deleteLesson: (id: string | number) => unwrap<any>(apiClient.delete(`/instructor/lessons/${id}`)),
  createResource: (lessonId: string | number, payload: Record<string, unknown>) => unwrap<any>(apiClient.post(`/instructor/lessons/${lessonId}/resources`, payload)),
  deleteResource: (id: string | number) => unwrap<any>(apiClient.delete(`/instructor/resources/${id}`)),
  quizzes: (courseId: string | number) => unwrap<any[]>(apiClient.get(`/instructor/courses/${courseId}/quizzes`)),
  createQuiz: (courseId: string | number, payload: Record<string, unknown>) => unwrap<any>(apiClient.post(`/instructor/courses/${courseId}/quizzes`, payload)),
  quiz: (id: string | number) => unwrap<any>(apiClient.get(`/instructor/quizzes/${id}`)),
  updateQuiz: (id: string | number, payload: Record<string, unknown>) => unwrap<any>(apiClient.put(`/instructor/quizzes/${id}`, payload)),
  deleteQuiz: (id: string | number) => unwrap<any>(apiClient.delete(`/instructor/quizzes/${id}`)),
  createQuestion: (quizId: string | number, payload: Record<string, unknown>) => unwrap<any>(apiClient.post(`/instructor/quizzes/${quizId}/questions`, payload)),
  updateQuestion: (id: string | number, payload: Record<string, unknown>) => unwrap<any>(apiClient.put(`/instructor/questions/${id}`, payload)),
  deleteQuestion: (id: string | number) => unwrap<any>(apiClient.delete(`/instructor/questions/${id}`)),
  createAnswer: (questionId: string | number, payload: Record<string, unknown>) => unwrap<any>(apiClient.post(`/instructor/questions/${questionId}/answers`, payload)),
  updateAnswer: (id: string | number, payload: Record<string, unknown>) => unwrap<any>(apiClient.put(`/instructor/answers/${id}`, payload)),
  deleteAnswer: (id: string | number) => unwrap<any>(apiClient.delete(`/instructor/answers/${id}`)),
  liveSessions: () => unwrap<any[]>(apiClient.get('/instructor/live-sessions')),
  createLiveSession: (payload: Record<string, unknown>) => unwrap<any>(apiClient.post('/instructor/live-sessions', payload)),
  updateLiveSession: (id: string | number, payload: Record<string, unknown>) => unwrap<any>(apiClient.put(`/instructor/live-sessions/${id}`, payload)),
  deleteLiveSession: (id: string | number) => unwrap<any>(apiClient.delete(`/instructor/live-sessions/${id}`)),
  startLiveSession: (id: string | number) => unwrap<any>(apiClient.post(`/instructor/live-sessions/${id}/start`)),
  endLiveSession: (id: string | number) => unwrap<any>(apiClient.post(`/instructor/live-sessions/${id}/end`)),
  cancelLiveSession: (id: string | number) => unwrap<any>(apiClient.post(`/instructor/live-sessions/${id}/cancel`)),
  students: (courseId?: string) => unwrap<any[]>(apiClient.get('/instructor/students', { params: courseId ? { courseId } : undefined })),
  reviews: () => unwrap<any[]>(apiClient.get('/instructor/reviews')),
  earnings: () => unwrap<any>(apiClient.get('/instructor/earnings')),
  requestWithdrawal: (payload: Record<string, unknown>) => unwrap<any>(apiClient.post('/instructor/withdrawals', payload)),
  withdrawals: () => unwrap<any[]>(apiClient.get('/instructor/withdrawals')),
  notifications: () => unwrap<any[]>(apiClient.get('/instructor/notifications')),
  markNotificationRead: (id: string | number) => unwrap<any>(apiClient.patch(`/instructor/notifications/${id}/read`)),
  supportTickets: () => unwrap<any[]>(apiClient.get('/instructor/support-tickets')),
  createSupportTicket: (payload: { subject: string; message: string }) => unwrap<any>(apiClient.post('/instructor/support-tickets', payload)),
  supportTicket: (id: string | number) => unwrap<any>(apiClient.get(`/instructor/support-tickets/${id}`)),
  replySupportTicket: (id: string | number, message: string) => unwrap<any>(apiClient.post(`/instructor/support-tickets/${id}/reply`, { message })),
  upload: (kind: 'image' | 'video' | 'file', file: File) => {
    const form = new FormData();
    form.append('file', file);
    return unwrap<any>(apiClient.post(`/uploads/${kind}`, form));
  },
};
