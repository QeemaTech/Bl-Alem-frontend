import { useTranslation } from 'react-i18next';
import DashboardLayout from './DashboardLayout';

export default function StudentLayout() {
  const { t } = useTranslation('dashboard');

  return (
    <DashboardLayout
      title={t('layouts.studentPanel')}
      sidebarTitleKey="sidebarTitles.studentLearning"
      platformBanner="student"
      sidebarVariant="student"
      notificationsPath="/student/notifications"
      profilePath="/student/profile"
      items={[]}
    />
  );
}
