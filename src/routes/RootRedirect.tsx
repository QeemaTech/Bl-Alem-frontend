import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { getDashboardPath } from '../utils/roleRedirect';

export function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="page-loader">جاري تحميل المنصة...</div>;
  return <Navigate to={isAuthenticated ? getDashboardPath(user?.role) : '/login'} replace />;
}
