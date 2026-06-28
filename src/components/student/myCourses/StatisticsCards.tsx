import { useTranslation } from 'react-i18next';
import { BookOpen, CheckCircle2, GraduationCap, PlayCircle } from '@/icons';
import { StatCard } from '../../ui/StatCard';
import type { MyCoursesStats } from './types';

interface StatisticsCardsProps {
  stats: MyCoursesStats;
}

export function StatisticsCards({ stats }: StatisticsCardsProps) {
  const { t } = useTranslation('courses');

  return (
    <div className="stats-grid student-my-courses-stats">
      <StatCard title={t('student.myCourses.stats.total')} value={String(stats.total)} icon={BookOpen} />
      <StatCard title={t('student.myCourses.stats.active')} value={String(stats.active)} icon={PlayCircle} />
      <StatCard title={t('student.myCourses.stats.completed')} value={String(stats.completed)} icon={CheckCircle2} />
      <StatCard title={t('student.myCourses.stats.avgProgress')} value={`${stats.avgProgress}%`} icon={GraduationCap} />
    </div>
  );
}
