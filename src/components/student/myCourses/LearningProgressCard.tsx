import { Clock3, Flame, GraduationCap, Target } from '@/icons';
import { Card } from '../../ui/Card';
import { ProgressBar } from '../../ui/ProgressBar';
import type { MyCoursesStats } from './types';
import { getJourneyMessage } from './utils';

interface LearningProgressCardProps {
  stats: MyCoursesStats;
  streak?: number | null;
}

export function LearningProgressCard({ stats, streak }: LearningProgressCardProps) {
  const message = getJourneyMessage(stats);

  return (
    <Card className="student-learning-progress-card">
      <div className="student-learning-progress-head">
        <span className="student-learning-progress-icon" aria-hidden>
          <GraduationCap size={22} />
        </span>
        <div className="student-learning-progress-copy">
          <strong>تقدّم التعلّم</strong>
          <p>{message}</p>
        </div>
        <span className="student-learning-progress-percent">{stats.avgProgress}%</span>
      </div>

      <ProgressBar value={stats.avgProgress} size="sm" />

      {stats.total ? (
        <div className="student-learning-progress-metrics">
          <span>
            <Clock3 size={15} aria-hidden />
            {stats.hoursLearned} ساعة تعلّم
          </span>
          <span>
            <Target size={15} aria-hidden />
            {stats.completed} دورة مكتملة
          </span>
          {streak != null && streak > 0 ? (
            <span>
              <Flame size={15} aria-hidden />
              {streak} يوم متتالي
            </span>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
