import { useTranslation } from 'react-i18next';
import DashboardLayout from './DashboardLayout';

export default function InstructorLayout() {
  const { t } = useTranslation('dashboard');

  return (
    <DashboardLayout
      title={t('layouts.instructorPanel')}
      sidebarTitleKey="sidebarTitles.instructorTraining"
      greetingKey="header.greetingInstructor"
      sidebarVariant="instructor"
      notificationsPath="/instructor/notifications"
      profilePath="/instructor/profile"
      items={[]}
    />
  );
}
