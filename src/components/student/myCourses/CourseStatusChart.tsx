import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useChartTheme } from '../../../hooks/useChartTheme';
import { ReportChart } from '../../reports/ReportChart';
import type { MyCoursesStats } from './types';

interface CourseStatusChartProps {
  stats: MyCoursesStats;
}

export function CourseStatusChart({ stats }: CourseStatusChartProps) {
  const { t, i18n } = useTranslation('courses');
  const lang = i18n.language;
  const theme = useChartTheme();

  const data = useMemo(() => [
    { label: t('student.myCourses.status.COMPLETED'), value: stats.completed, color: theme.success },
    { label: t('student.myCourses.status.ACTIVE'), value: stats.active, color: theme.secondary },
    { label: t('student.myCourses.status.NOT_STARTED'), value: stats.notStarted, color: theme.muted },
  ].filter((item) => item.value > 0), [t, lang, stats, theme]);

  if (!data.length) return null;

  return (
    <div className="student-my-courses-chart-wrap">
      <ReportChart title={t('student.myCourses.charts.statusDistribution')} type="pie" data={data} height={168} />
    </div>
  );
}
