import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { getDashboardPath } from '../utils/roleRedirect';

export function GuestRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="page-loader">جاري تحميل الجلسة...</div>;
  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Outlet />;
}
