import { BookOpen, CheckCircle2, GraduationCap, PlayCircle } from '@/icons';
import { StatCard } from '../../ui/StatCard';
import type { MyCoursesStats } from './types';

interface StatisticsCardsProps {
  stats: MyCoursesStats;
}

export function StatisticsCards({ stats }: StatisticsCardsProps) {
  return (
    <div className="stats-grid student-my-courses-stats">
      <StatCard title="إجمالي الدورات" value={String(stats.total)} icon={BookOpen} />
      <StatCard title="قيد التعلم" value={String(stats.active)} icon={PlayCircle} />
      <StatCard title="مكتمل" value={String(stats.completed)} icon={CheckCircle2} />
      <StatCard title="متوسط التقدم" value={`${stats.avgProgress}%`} icon={GraduationCap} />
    </div>
  );
}
