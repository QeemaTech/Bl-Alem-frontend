import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { AdminDashboardSkeleton } from '../../components/admin/dashboard/AdminDashboardSkeleton';
import { DashboardOverview } from '../../components/admin/dashboard/DashboardOverview';
import type { AdminDashboardApiData } from '../../components/admin/dashboard/dashboardTypes';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    adminApi.dashboard()
      .then(setData)
      .catch(() => {
        setData(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <AdminDashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="page-grid">
        <EmptyState
          title="تعذّر تحميل لوحة التحكم"
          description="حدث خطأ أثناء جلب بيانات المنصة. تحقق من الاتصال ثم أعد المحاولة."
        />
        <Button variant="outline" onClick={load}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return <DashboardOverview data={data} />;
}
