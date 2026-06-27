import { adminApi } from '../../api/admin';
import { AdminAccountDetailView } from './AdminAccountDetailView';

export default function AdminStudentDetailPage() {
  return (
    <AdminAccountDetailView
      variant="student"
      onDelete={(id) => adminApi.deleteStudent(id)}
      roleLocked="STUDENT"
    />
  );
}
