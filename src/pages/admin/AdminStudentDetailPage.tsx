import { adminApi } from '../../api/admin';
import { AdminAccountDetailView } from './AdminAccountDetailView';

export default function AdminStudentDetailPage() {
  return (
    <AdminAccountDetailView
      backTo="/admin/students"
      backLabel="العودة للطلاب"
      fallbackPath="/admin/students"
      loadErrorToast="تعذّر تحميل بيانات الطالب."
      editDialogTitle="تعديل الطالب"
      deleteDialogTitle="حذف الطالب"
      deleteSuccessToast="تم حذف الطالب."
      deleteErrorToast="تعذّر حذف الطالب."
      onDelete={(id) => adminApi.deleteStudent(id)}
      roleLocked="STUDENT"
    />
  );
}
