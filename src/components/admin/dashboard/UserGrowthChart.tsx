import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from './ChartCard';
import { DashboardChartTooltip } from './DashboardChartTooltip';
import { fmtNum } from './dashboardFormat';
import type { DualTrendPoint } from './dashboardTypes';
import { useChartTheme } from './useChartTheme';

interface UserGrowthChartProps {
  data: DualTrendPoint[];
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  const theme = useChartTheme();
  const totalStudents = data.reduce((sum, item) => sum + item.students, 0);
  const totalInstructors = data.reduce((sum, item) => sum + item.instructors, 0);

  return (
    <ChartCard
      title="نمو المستخدمين"
      subtitle="طلاب مقابل محاضرين"
      total={fmtNum(totalStudents + totalInstructors)}
      ariaLabel="مخطط نمو المستخدمين الجدد"
    >
      <div className="admin-dash-bar-legend" aria-hidden>
        <span><i className="is-students" /> طلاب</span>
        <span><i className="is-instructors" /> محاضرون</span>
      </div>
      <div className="admin-dash-bar-chart" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: theme.text }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fontSize: 10, fill: theme.text }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => fmtNum(Number(v))}
              width={36}
            />
            <Tooltip content={<DashboardChartTooltip dual />} />
            <Bar
              dataKey="students"
              name="طلاب"
              fill={theme.primary}
              radius={[4, 4, 0, 0]}
              maxBarSize={14}
              isAnimationActive={false}
            />
            <Bar
              dataKey="instructors"
              name="محاضرون"
              fill={theme.secondary}
              radius={[4, 4, 0, 0]}
              maxBarSize={14}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
