import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from './ChartCard';
import { DashboardChartTooltip } from './DashboardChartTooltip';
import { fmtMoney, fmtNum } from './dashboardFormat';
import type { TrendPoint } from './dashboardTypes';
import { TrendBadge } from './TrendBadge';
import { useChartTheme } from './useChartTheme';

interface RevenueChartProps {
  data: TrendPoint[];
  growth: number;
}

export function RevenueChart({ data, growth }: RevenueChartProps) {
  const theme = useChartTheme();
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartCard
      title="اتجاه الإيرادات"
      subtitle="آخر 12 شهراً"
      total={fmtMoney(total / 12)}
      ariaLabel="مخطط اتجاه الإيرادات الشهري"
      action={<TrendBadge value={growth} label="نمو سنوي" />}
    >
      <div className="admin-dash-line-chart" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: theme.text }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: theme.text }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => fmtNum(Number(v))}
              width={44}
            />
            <Tooltip content={<DashboardChartTooltip valueLabel="ج.م" />} />
            <Line
              type="monotone"
              dataKey="value"
              name="الإيرادات"
              stroke={theme.primary}
              strokeWidth={2.5}
              dot={{ r: 3, fill: theme.primary, strokeWidth: 2, stroke: theme.surface }}
              activeDot={{ r: 5, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
