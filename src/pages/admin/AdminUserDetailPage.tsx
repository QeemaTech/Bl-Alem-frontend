import { adminApi } from '../../api/admin';
import { AdminAccountDetailView } from './AdminAccountDetailView';

export default function AdminUserDetailPage() {
  return (
    <AdminAccountDetailView
      variant="user"
      onDelete={(id) => adminApi.deleteUser(id)}
    />
  );
}
