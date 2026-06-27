import { LoadingSkeleton } from '../../ui/LoadingSkeleton';

export function ProfilePageSkeleton() {
  return (
    <div className="page-grid student-profile-page" aria-busy="true" aria-label="جاري تحميل الملف الشخصي">
      <div className="skeleton skeleton-block student-profile-skeleton-header" />
      <div className="stats-grid student-profile-stats">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingSkeleton key={index} variant="stat" />
        ))}
      </div>
      <div className="student-profile-layout">
        <div className="student-profile-summary">
          <div className="skeleton skeleton-block student-profile-skeleton-summary" />
        </div>
        <div className="student-profile-main">
          <div className="skeleton skeleton-block student-profile-skeleton-form" />
          <div className="skeleton skeleton-block student-profile-skeleton-password" />
        </div>
      </div>
    </div>
  );
}
