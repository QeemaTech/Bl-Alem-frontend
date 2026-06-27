import { useChartTheme } from '../../../hooks/useChartTheme';
import { ReportChart } from '../../reports/ReportChart';
import type { MyCoursesStats } from './types';

interface CourseStatusChartProps {
  stats: MyCoursesStats;
}

export function CourseStatusChart({ stats }: CourseStatusChartProps) {
  const theme = useChartTheme();
  const data = [
    { label: 'مكتمل', value: stats.completed, color: theme.success },
    { label: 'قيد التعلم', value: stats.active, color: theme.secondary },
    { label: 'لم يبدأ', value: stats.notStarted, color: theme.muted },
  ].filter((item) => item.value > 0);

  if (!data.length) return null;

  return (
    <div className="student-my-courses-chart-wrap">
      <ReportChart title="حالة الدورات" type="pie" data={data} height={168} />
    </div>
  );
}
