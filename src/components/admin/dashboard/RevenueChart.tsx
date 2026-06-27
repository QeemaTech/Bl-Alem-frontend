import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DEFAULT_CURRENCY, getCurrencySymbol } from '@/utils/currency';
import { ChartCard } from './ChartCard';
import { DashboardChartTooltip } from './DashboardChartTooltip';
import { useDashboardFormatters } from '../../../hooks/useDashboardAnalytics';
import type { TrendPoint } from './dashboardTypes';
import { TrendBadge } from './TrendBadge';
import { useChartTheme } from './useChartTheme';

interface RevenueChartProps {
  data: TrendPoint[];
  growth: number;
}

export function RevenueChart({ data, growth }: RevenueChartProps) {
  const { t, i18n } = useTranslation('dashboard');
  const { fmtMoney, fmtNum } = useDashboardFormatters();
  const theme = useChartTheme();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const currencySymbol = getCurrencySymbol(DEFAULT_CURRENCY, i18n.language);

  return (
    <ChartCard
      title={t('admin.dashboard.charts.revenueTrend')}
      subtitle={t('admin.dashboard.charts.last12Months')}
      total={fmtMoney(total / 12)}
      ariaLabel={t('admin.dashboard.charts.revenueAria')}
      action={<TrendBadge value={growth} label={t('admin.dashboard.charts.yearlyGrowth')} />}
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
            <Tooltip content={<DashboardChartTooltip valueLabel={currencySymbol} />} />
            <Line
              type="monotone"
              dataKey="value"
              name={t('admin.dashboard.charts.revenueSeries')}
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
