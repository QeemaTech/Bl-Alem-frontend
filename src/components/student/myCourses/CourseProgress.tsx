interface CourseProgressProps {
  value: number;
  showLabel?: boolean;
}

export function CourseProgress({ value, showLabel = true }: CourseProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="student-my-course-progress">
      {showLabel ? (
        <div className="student-my-course-progress-head">
          <span>التقدم</span>
          <strong>{clamped}%</strong>
        </div>
      ) : null}
      <div
        className="progress progress-sm"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
