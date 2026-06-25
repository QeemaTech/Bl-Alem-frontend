import {
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ChartCard } from './ChartCard';
import { DashboardChartTooltip } from './DashboardChartTooltip';
import { fmtNum } from './dashboardFormat';
import type { NamedValue } from './dashboardTypes';
import { useChartTheme } from './useChartTheme';

interface DonutChartProps {
  title: string;
  subtitle?: string;
  data: NamedValue[];
  ariaLabel?: string;
}

function DonutCenter({ viewBox, total }: { viewBox?: Record<string, number>; total: number }) {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.2em" className="admin-dash-donut-value">{fmtNum(total)}</tspan>
      <tspan x={cx} dy="1.4em" className="admin-dash-donut-label">الإجمالي</tspan>
    </text>
  );
}

export function DonutChart({ title, subtitle, data, ariaLabel }: DonutChartProps) {
  const theme = useChartTheme();
  const chartData = data.filter((item) => item.value >= 0);
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const colors = theme.colors;

  if (!total) {
    return (
      <ChartCard title={title} subtitle={subtitle} ariaLabel={ariaLabel}>
        <div className="admin-dash-chart-empty">لا توجد بيانات كافية للعرض</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={title} subtitle={subtitle} total={fmtNum(total)} ariaLabel={ariaLabel}>
      <div className="admin-dash-donut-layout">
        <div className="admin-dash-donut-canvas" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={2}
                stroke={theme.surface}
                strokeWidth={2}
                isAnimationActive={false}
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
                <Label
                  content={(props) => (
                    <DonutCenter viewBox={props.viewBox as Record<string, number> | undefined} total={total} />
                  )}
                  position="center"
                />
              </Pie>
              <Tooltip content={<DashboardChartTooltip showPercent valueLabel="" />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="admin-dash-donut-legend" aria-label="وسيلة إيضاح المخطط">
          {chartData.map((item, index) => (
            <li key={item.name}>
              <span
                className="admin-dash-donut-dot"
                style={{ backgroundColor: colors[index % colors.length] }}
                aria-hidden
              />
              <span className="admin-dash-donut-name">{item.name}</span>
              <span className="admin-dash-donut-meta">
                <strong>{fmtNum(item.value)}</strong>
                <small>({((item.value / total) * 100).toFixed(0)}%)</small>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
