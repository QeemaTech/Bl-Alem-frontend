interface LoadingSkeletonProps {
  variant?: 'card' | 'stat' | 'row' | 'block';
  count?: number;
}

export function LoadingSkeleton({ variant = 'card', count = 1 }: LoadingSkeletonProps) {
  const className =
    variant === 'stat' ? 'skeleton skeleton-stat' :
    variant === 'row' ? 'skeleton skeleton-row' :
    variant === 'block' ? 'skeleton skeleton-block' :
    'skeleton skeleton-card';

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={className} aria-hidden="true" />
      ))}
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="page-grid">
      <div className="skeleton skeleton-block" style={{ height: 160 }} />
      <div className="skeleton-grid-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-stat" />
        ))}
      </div>
      <div className="content-grid wide">
        <div className="skeleton skeleton-block" />
        <div className="skeleton skeleton-block" />
      </div>
    </div>
  );
}

export function CourseGridSkeleton() {
  return (
    <div className="skeleton-grid-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" style={{ height: 280 }} />
      ))}
    </div>
  );
}
