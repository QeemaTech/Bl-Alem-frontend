import { adminApi } from '../../api/admin';
import { AdminAccountDetailView } from './AdminAccountDetailView';

export default function AdminInstructorDetailPage() {
  return (
    <AdminAccountDetailView
      variant="instructor"
      backTo="/admin/instructors"
      backLabel="العودة للمحاضرين"
      fallbackPath="/admin/instructors"
      loadErrorToast="تعذّر تحميل بيانات المحاضر."
      editDialogTitle="تعديل المحاضر"
      deleteDialogTitle="حذف المحاضر"
      deleteSuccessToast="تم حذف المحاضر."
      deleteErrorToast="لا يمكن حذف محاضر لديه دورات."
      onDelete={(id) => adminApi.deleteInstructor(id)}
      roleLocked="INSTRUCTOR"
    />
  );
}
