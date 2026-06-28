import { useTranslation } from 'react-i18next';
import { Clock3, Flame, GraduationCap, Target } from '@/icons';
import { Card } from '../../ui/Card';
import { ProgressBar } from '../../ui/ProgressBar';
import { useStudentMyCourseLabels } from '../../../hooks/useStudentMyCourseLabels';
import type { MyCoursesStats } from './types';

interface LearningProgressCardProps {
  stats: MyCoursesStats;
  streak?: number | null;
}

export function LearningProgressCard({ stats, streak }: LearningProgressCardProps) {
  const { t } = useTranslation('courses');
  const { getJourneyMessage } = useStudentMyCourseLabels();
  const message = getJourneyMessage(stats);

  return (
    <Card className="student-learning-progress-card">
      <div className="student-learning-progress-head">
        <span className="student-learning-progress-icon" aria-hidden>
          <GraduationCap size={22} />
        </span>
        <div className="student-learning-progress-copy">
          <strong>{t('student.myCourses.learningProgress.title')}</strong>
          <p>{message}</p>
        </div>
        <span className="student-learning-progress-percent">{stats.avgProgress}%</span>
      </div>

      <ProgressBar value={stats.avgProgress} size="sm" />

      {stats.total ? (
        <div className="student-learning-progress-metrics">
          <span>
            <Clock3 size={15} aria-hidden />
            {t('student.myCourses.learningProgress.hoursLearned', { count: stats.hoursLearned })}
          </span>
          <span>
            <Target size={15} aria-hidden />
            {t('student.myCourses.learningProgress.coursesCompleted', { count: stats.completed })}
          </span>
          {streak != null && streak > 0 ? (
            <span>
              <Flame size={15} aria-hidden />
              {t('student.myCourses.learningProgress.streakDays', { count: streak })}
            </span>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
