import { adminApi } from '../../api/admin';
import { AdminAccountDetailView } from './AdminAccountDetailView';

export default function AdminInstructorDetailPage() {
  return (
    <AdminAccountDetailView
      variant="instructor"
      onDelete={(id) => adminApi.deleteInstructor(id)}
      roleLocked="INSTRUCTOR"
    />
  );
}
