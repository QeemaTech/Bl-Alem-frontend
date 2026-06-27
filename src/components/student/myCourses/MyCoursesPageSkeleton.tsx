export function MyCoursesPageSkeleton() {
  return (
    <div className="page-grid student-my-courses-page">
      <div className="skeleton skeleton-block student-my-courses-skeleton-header" />
      <div className="stats-grid student-my-courses-stats">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-stat" />
        ))}
      </div>
      <div className="student-my-courses-insights">
        <div className="skeleton skeleton-block student-my-courses-skeleton-journey" />
        <div className="skeleton skeleton-block student-my-courses-skeleton-chart" />
      </div>
      <div className="skeleton skeleton-block student-my-courses-skeleton-toolbar" />
      <div className="student-my-courses-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-card student-my-courses-skeleton-card" />
        ))}
      </div>
    </div>
  );
}
