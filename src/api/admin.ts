import { apiClient } from './client';
import type { ApiResponse } from '../utils/types';
const unwrap = async <T>(request: Promise<{ data: ApiResponse<T> }>) => (await request).data.data;
const q = (params?: Record<string, string>) => ({ params });
export const adminApi = {
  dashboard: () => unwrap<any>(apiClient.get('/admin/dashboard')),
  users: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/users', q(params))), user: (id: number|string) => unwrap<any>(apiClient.get(`/admin/users/${id}`)), createUser: (p: any) => unwrap<any>(apiClient.post('/admin/users', p)), updateUser: (id: any, p: any) => unwrap<any>(apiClient.put(`/admin/users/${id}`, p)), deleteUser: (id: any) => unwrap<any>(apiClient.delete(`/admin/users/${id}`)), userStatus: (id: any, status: string) => unwrap<any>(apiClient.patch(`/admin/users/${id}/status`, { status })),
  students: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/students', q(params))), student: (id: any) => unwrap<any>(apiClient.get(`/admin/students/${id}`)), createStudent: (p: any) => unwrap<any>(apiClient.post('/admin/students', p)), updateStudent: (id: any, p: any) => unwrap<any>(apiClient.put(`/admin/students/${id}`, p)), deleteStudent: (id: any) => unwrap<any>(apiClient.delete(`/admin/students/${id}`)),
  instructors: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/instructors', q(params))), instructor: (id: any) => unwrap<any>(apiClient.get(`/admin/instructors/${id}`)), createInstructor: (p: any) => unwrap<any>(apiClient.post('/admin/instructors', p)), updateInstructor: (id: any, p: any) => unwrap<any>(apiClient.put(`/admin/instructors/${id}`, p)), deleteInstructor: (id: any) => unwrap<any>(apiClient.delete(`/admin/instructors/${id}`)), approveInstructor: (id: any) => unwrap<any>(apiClient.patch(`/admin/instructors/${id}/approve`)), rejectInstructor: (id: any, rejectionReason: string) => unwrap<any>(apiClient.patch(`/admin/instructors/${id}/reject`, { rejectionReason })), suspendInstructor: (id: any) => unwrap<any>(apiClient.patch(`/admin/instructors/${id}/suspend`)), activateInstructor: (id: any) => unwrap<any>(apiClient.patch(`/admin/instructors/${id}/activate`)),
  categories: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/categories', q(params))), createCategory: (p: any) => unwrap<any>(apiClient.post('/admin/categories', p)), updateCategory: (id: any, p: any) => unwrap<any>(apiClient.put(`/admin/categories/${id}`, p)), deleteCategory: (id: any) => unwrap<any>(apiClient.delete(`/admin/categories/${id}`)), categoryStatus: (id: any, status: string) => unwrap<any>(apiClient.patch(`/admin/categories/${id}/status`, { status })),
  learningPaths: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/learning-paths', q(params))),
  learningPath: (id: any) => unwrap<any>(apiClient.get(`/admin/learning-paths/${id}`)),
  createLearningPath: (p: any) => unwrap<any>(apiClient.post('/admin/learning-paths', p)),
  updateLearningPath: (id: any, p: any) => unwrap<any>(apiClient.put(`/admin/learning-paths/${id}`, p)),
  deleteLearningPath: (id: any) => unwrap<any>(apiClient.delete(`/admin/learning-paths/${id}`)),
  addLearningPathCourse: (id: any, p: { courseId: number; order?: number }) => unwrap<any>(apiClient.post(`/admin/learning-paths/${id}/courses`, p)),
  removeLearningPathCourse: (id: any, courseId: number) => unwrap<any>(apiClient.delete(`/admin/learning-paths/${id}/courses/${courseId}`)),
  reorderLearningPathCourses: (id: any, courses: Array<{ id?: number; courseId?: number; order: number }>) => unwrap<any>(apiClient.put(`/admin/learning-paths/${id}/courses/reorder`, { courses })),
  courses: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/courses', q(params))), course: (id: any) => unwrap<any>(apiClient.get(`/admin/courses/${id}`)), courseContent: (id: any) => unwrap<any>(apiClient.get(`/admin/courses/${id}/content`)), updateCourse: (id: any, p: any) => unwrap<any>(apiClient.put(`/admin/courses/${id}`, p)), deleteCourse: (id: any) => unwrap<any>(apiClient.delete(`/admin/courses/${id}`)), approveCourse: (id: any) => unwrap<any>(apiClient.patch(`/admin/courses/${id}/approve`)), publishCourse: (id: any) => unwrap<any>(apiClient.patch(`/admin/courses/${id}/publish`)), rejectCourse: (id: any, rejectionReason: string) => unwrap<any>(apiClient.patch(`/admin/courses/${id}/reject`, { rejectionReason })), suspendCourse: (id: any) => unwrap<any>(apiClient.patch(`/admin/courses/${id}/suspend`)), featureCourse: (id: any) => unwrap<any>(apiClient.patch(`/admin/courses/${id}/feature`)),
  liveSessions: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/live-sessions', q(params))), updateLiveSession: (id: any, p: any) => unwrap<any>(apiClient.put(`/admin/live-sessions/${id}`, p)), deleteLiveSession: (id: any) => unwrap<any>(apiClient.delete(`/admin/live-sessions/${id}`)), cancelLiveSession: (id: any) => unwrap<any>(apiClient.patch(`/admin/live-sessions/${id}/cancel`)),
  payments: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/payments', q(params))), refundPayment: (id: any) => unwrap<any>(apiClient.patch(`/admin/payments/${id}/refund`)),
  coupons: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/coupons', q(params))), createCoupon: (p: any) => unwrap<any>(apiClient.post('/admin/coupons', p)), updateCoupon: (id: any, p: any) => unwrap<any>(apiClient.put(`/admin/coupons/${id}`, p)), deleteCoupon: (id: any) => unwrap<any>(apiClient.delete(`/admin/coupons/${id}`)), couponStatus: (id: any, status: string) => unwrap<any>(apiClient.patch(`/admin/coupons/${id}/status`, { status })),
  referrals: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/referrals', q(params))),
  rewards: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/rewards', q(params))), rewardStatus: (id: any, status: string) => unwrap<any>(apiClient.patch(`/admin/rewards/${id}/status`, { status })),
  certificates: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/certificates', q(params))),
  certificateEligible: () => unwrap<any[]>(apiClient.get('/admin/certificates/eligible')),
  certificate: (id: any) => unwrap<any>(apiClient.get(`/admin/certificates/${id}`)),
  generateCertificate: (enrollmentId: any) => unwrap<any>(apiClient.post(`/admin/certificates/generate/${enrollmentId}`)),
  reviews: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/reviews', q(params))), deleteReview: (id: any) => unwrap<any>(apiClient.delete(`/admin/reviews/${id}`)),
  notifications: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/notifications', q(params))), sendNotification: (p: any) => unwrap<any>(apiClient.post('/admin/notifications/send', p)),
  supportTickets: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/support-tickets', q(params))), supportTicket: (id: any) => unwrap<any>(apiClient.get(`/admin/support-tickets/${id}`)), supportStatus: (id: any, status: string) => unwrap<any>(apiClient.patch(`/admin/support-tickets/${id}/status`, { status })), supportReply: (id: any, message: string) => unwrap<any>(apiClient.post(`/admin/support-tickets/${id}/reply`, { message })),
  wallets: () => unwrap<any[]>(apiClient.get('/admin/wallets')),
  withdrawals: (params?: Record<string, string>) => unwrap<any[]>(apiClient.get('/admin/withdrawals', q(params))),
  approveWithdrawal: (id: any) => unwrap<any>(apiClient.patch(`/admin/withdrawals/${id}/approve`)),
  rejectWithdrawal: (id: any, notes?: string) => unwrap<any>(apiClient.patch(`/admin/withdrawals/${id}/reject`, { notes })),
  markWithdrawalPaid: (id: any, payload?: { transferProofImage?: string }) => unwrap<any>(apiClient.patch(`/admin/withdrawals/${id}/paid`, payload || {})),
  settings: () => unwrap<any[]>(apiClient.get('/admin/settings')),
  updateSettings: (settings: Record<string, string | number | boolean>) => unwrap<any[]>(apiClient.put('/admin/settings', { settings })),
  updateSetting: (key: string, value: any) => unwrap<any>(apiClient.put(`/admin/settings/${key}`, { value })),
  upload: (kind: 'image' | 'video' | 'file', file: File) => {
    const form = new FormData();
    form.append('file', file);
    return unwrap<any>(apiClient.post(`/uploads/${kind}`, form));
  },
  report: (type: 'revenue'|'users'|'courses'|'instructors'|'enrollments') => unwrap<any>(apiClient.get(`/admin/reports/${type}`)),
};
