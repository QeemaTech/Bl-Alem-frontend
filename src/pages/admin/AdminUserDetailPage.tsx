import { adminApi } from '../../api/admin';
import { AdminAccountDetailView } from './AdminAccountDetailView';

export default function AdminUserDetailPage() {
  return (
    <AdminAccountDetailView
      backTo="/admin/users"
      backLabel="العودة للمستخدمين"
      fallbackPath="/admin/users"
      loadErrorToast="تعذّر تحميل بيانات المستخدم."
      editDialogTitle="تعديل المستخدم"
      deleteDialogTitle="حذف المستخدم"
      deleteSuccessToast="تم حذف المستخدم."
      deleteErrorToast="تعذّر حذف المستخدم."
      onDelete={(id) => adminApi.deleteUser(id)}
    />
  );
}
