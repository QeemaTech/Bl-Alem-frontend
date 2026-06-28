import { useTranslation } from 'react-i18next';
import { LoadingSkeleton } from '../../ui/LoadingSkeleton';

export function ProfilePageSkeleton() {
  const { t } = useTranslation('profile');

  return (
    <div className="page-grid student-profile-page" aria-busy="true" aria-label={t('student.loadingProfile')}>
      <LoadingSkeleton variant="block" />
      <div className="stats-grid student-profile-stats">
        <LoadingSkeleton variant="stat" count={4} />
      </div>
      <div className="student-profile-layout">
        <LoadingSkeleton variant="card" />
        <div className="student-profile-main stack-md">
          <LoadingSkeleton variant="card" count={2} />
        </div>
      </div>
    </div>
  );
}
