import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RootRedirect } from './routes/RootRedirect';
import AuthLayout from './layouts/AuthLayout';
import StudentLayout from './layouts/StudentLayout';
import InstructorLayout from './layouts/InstructorLayout';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OtpPlaceholderPage from './pages/auth/OtpPlaceholderPage';
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import StudentCoursesPage from './pages/student/StudentCoursesPage';
import StudentCourseDetailsPage from './pages/student/StudentCourseDetailsPage';
import StudentMyCoursesPage from './pages/student/StudentMyCoursesPage';
import StudentPlayerPage from './pages/student/StudentPlayerPage';
import StudentQuizPage from './pages/student/StudentQuizPage';
import StudentLivePage from './pages/student/StudentLivePage';
import StudentCertificatesPage from './pages/student/StudentCertificatesPage';
import StudentPaymentsPage from './pages/student/StudentPaymentsPage';
import StudentRewardsPage from './pages/student/StudentRewardsPage';
import StudentWalletPage from './pages/student/StudentWalletPage';
import StudentCommunityPage from './pages/student/StudentCommunityPage';
import StudentPricingPage from './pages/student/StudentPricingPage';
import StudentLearningPathsPage from './pages/student/StudentLearningPathsPage';
import StudentNotificationsPage from './pages/student/StudentNotificationsPage';
import StudentSupportPage from './pages/student/StudentSupportPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import InstructorDashboardPage from './pages/instructor/InstructorDashboardPage';
import InstructorCoursesPage from './pages/instructor/InstructorCoursesPage';
import InstructorCourseFormPage from './pages/instructor/InstructorCourseFormPage';
import InstructorCourseBuilderPage from './pages/instructor/InstructorCourseBuilderPage';
import InstructorSectionFormPage from './pages/instructor/InstructorSectionFormPage';
import InstructorLessonFormPage from './pages/instructor/InstructorLessonFormPage';
import InstructorResourceFormPage from './pages/instructor/InstructorResourceFormPage';
import InstructorQuizCreatePage from './pages/instructor/InstructorQuizCreatePage';
import InstructorQuizBuilderPage from './pages/instructor/InstructorQuizBuilderPage';
import InstructorLivePage from './pages/instructor/InstructorLivePage';
import InstructorStudentsPage from './pages/instructor/InstructorStudentsPage';
import InstructorStudentDetailPage from './pages/instructor/InstructorStudentDetailPage';
import InstructorReviewsPage from './pages/instructor/InstructorReviewsPage';
import InstructorEarningsPage from './pages/instructor/InstructorEarningsPage';
import InstructorProfilePage from './pages/instructor/InstructorProfilePage';
import InstructorNotificationsPage from './pages/instructor/InstructorNotificationsPage';
import InstructorSupportPage from './pages/instructor/InstructorSupportPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminResourcePage from './pages/admin/AdminResourcePage';
import AdminCourseReviewPage from './pages/admin/AdminCourseReviewPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminWithdrawalsPage from './pages/admin/AdminWithdrawalsPage';
import AdminSupportPage from './pages/admin/AdminSupportPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminCertificatesPage from './pages/admin/AdminCertificatesPage';
import AdminRewardsPage from './pages/admin/AdminRewardsPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminLiveSessionsPage from './pages/admin/AdminLiveSessionsPage';
import AdminCoursesPage from './pages/admin/AdminCoursesPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminLearningPathsPage from './pages/admin/AdminLearningPathsPage';
import AdminInstructorsPage from './pages/admin/AdminInstructorsPage';
import AdminStudentsPage from './pages/admin/AdminStudentsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminStudentDetailPage from './pages/admin/AdminStudentDetailPage';
import AdminInstructorDetailPage from './pages/admin/AdminInstructorDetailPage';
import UnauthorizedPage from './pages/shared/UnauthorizedPage';
import NotFoundPage from './pages/shared/NotFoundPage';
import CertificateVerifyPage from './pages/shared/CertificateVerifyPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/otp" element={<OtpPlaceholderPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
        <Route element={<StudentLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/student/courses" element={<StudentCoursesPage />} />
          <Route path="/student/courses/:id" element={<StudentCourseDetailsPage />} />
          <Route path="/student/my-courses" element={<StudentMyCoursesPage />} />
          <Route path="/student/player/:courseId" element={<StudentPlayerPage />} />
          <Route path="/student/quizzes/:quizId" element={<StudentQuizPage />} />
          <Route path="/student/live" element={<StudentLivePage />} />
          <Route path="/student/certificates" element={<StudentCertificatesPage />} />
          <Route path="/student/payments" element={<StudentPaymentsPage />} />
          <Route path="/student/rewards" element={<StudentRewardsPage />} />
          <Route path="/student/wallet" element={<StudentWalletPage />} />
          <Route path="/student/community" element={<StudentCommunityPage />} />
          <Route path="/student/pricing" element={<StudentPricingPage />} />
          <Route path="/student/learning-paths" element={<StudentLearningPathsPage />} />
          <Route path="/student/learning-paths/:id" element={<StudentLearningPathsPage />} />
          <Route path="/student/notifications" element={<StudentNotificationsPage />} />
          <Route path="/student/support" element={<StudentSupportPage />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["INSTRUCTOR"]} />}>
        <Route element={<InstructorLayout />}>
          <Route path="/instructor/dashboard" element={<InstructorDashboardPage />} />
          <Route path="/instructor/courses" element={<InstructorCoursesPage />} />
          <Route path="/instructor/courses/create" element={<InstructorCourseFormPage />} />
          <Route path="/instructor/courses/:id/edit" element={<InstructorCourseFormPage />} />
          <Route path="/instructor/courses/:id/sections/new" element={<InstructorSectionFormPage />} />
          <Route path="/instructor/courses/:id/sections/:sectionId/edit" element={<InstructorSectionFormPage />} />
          <Route path="/instructor/courses/:id/lessons/new" element={<InstructorLessonFormPage />} />
          <Route path="/instructor/courses/:id/lessons/:lessonId/edit" element={<InstructorLessonFormPage />} />
          <Route path="/instructor/courses/:id/resources/new" element={<InstructorResourceFormPage />} />
          <Route path="/instructor/courses/:id/lessons/:lessonId/resources/new" element={<InstructorResourceFormPage />} />
          <Route path="/instructor/courses/:id/quizzes/new" element={<InstructorQuizCreatePage />} />
          <Route path="/instructor/courses/:id/builder" element={<InstructorCourseBuilderPage />} />
          <Route path="/instructor/quizzes/:quizId" element={<InstructorQuizBuilderPage />} />
          <Route path="/instructor/live" element={<InstructorLivePage />} />
          <Route path="/instructor/students" element={<InstructorStudentsPage />} />
          <Route path="/instructor/students/:userId" element={<InstructorStudentDetailPage />} />
          <Route path="/instructor/reviews" element={<InstructorReviewsPage />} />
          <Route path="/instructor/earnings" element={<InstructorEarningsPage />} />
          <Route path="/instructor/profile" element={<InstructorProfilePage />} />
          <Route path="/instructor/notifications" element={<InstructorNotificationsPage />} />
          <Route path="/instructor/support" element={<InstructorSupportPage />} />
          <Route path="/instructor" element={<Navigate to="/instructor/dashboard" replace />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
          <Route path="/admin/support" element={<AdminSupportPage />} />
          <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
          <Route path="/admin/reviews" element={<AdminReviewsPage />} />
          <Route path="/admin/certificates" element={<AdminCertificatesPage />} />
          <Route path="/admin/rewards" element={<AdminRewardsPage />} />
          <Route path="/admin/coupons" element={<AdminCouponsPage />} />
          <Route path="/admin/payments" element={<AdminPaymentsPage />} />
          <Route path="/admin/live" element={<AdminLiveSessionsPage />} />
          <Route path="/admin/courses" element={<AdminCoursesPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/admin/learning-paths" element={<AdminLearningPathsPage />} />
          <Route path="/admin/instructors/:id" element={<AdminInstructorDetailPage />} />
          <Route path="/admin/students/:id" element={<AdminStudentDetailPage />} />
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/instructors" element={<AdminInstructorsPage />} />
          <Route path="/admin/students" element={<AdminStudentsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/course-review/:id" element={<AdminCourseReviewPage />} />
          <Route path="/admin/:resource" element={<AdminResourcePage />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="/certificates/verify/:certificateNumber" element={<CertificateVerifyPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
