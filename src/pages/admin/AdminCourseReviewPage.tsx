import { Navigate, useParams } from 'react-router-dom';

/** @deprecated Use /admin/courses/:courseId — kept for backward-compatible links */
export default function AdminCourseReviewPage() {
  const { id } = useParams();
  return <Navigate to={`/admin/courses/${id}`} replace />;
}
