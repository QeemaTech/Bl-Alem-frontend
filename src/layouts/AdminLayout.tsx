import { useTranslation } from 'react-i18next';
import DashboardLayout from './DashboardLayout';
import { adminNavItems } from '../components/dashboard/sidebar/adminNavConfig';

export default function AdminLayout() {
  const { t } = useTranslation('dashboard');

  return (
    <DashboardLayout
      title={t('layouts.adminPanel')}
      sidebarTitleKey="sidebarTitles.platformAdmin"
      greetingKey="header.greetingAdmin"
      notificationsPath="/admin/notifications"
      items={adminNavItems}
    />
  );
}
