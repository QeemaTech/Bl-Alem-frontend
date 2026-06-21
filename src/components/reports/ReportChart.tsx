import type { ReactElement } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export const CHART_COLORS = [
  '#22A6BC',
  '#16A34A',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#0EA5E9',
  '#EC4899',
  '#64748B',
];

export interface ChartItem {
  label: string;
  value: number;
}

interface ReportChartProps {
  title: string;
  type: 'bar' | 'line' | 'pie';
  data: ChartItem[];
  height?: number;
}

const fmt = (value: number) => Number(value || 0).toLocaleString('ar-SA');

const truncate = (text: string, max = 14) => (
  text.length > max ? `${text.slice(0, max)}…` : text
);

interface TooltipPayload {
  name?: string;
  value?: number;
  payload?: { name?: string; value?: number; percent?: number };
}

function ChartTooltip({
  active,
  payload,
  valueLabel = 'القيمة',
  showPercent,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  valueLabel?: string;
  showPercent?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const name = item.name || item.payload?.name || '—';
  const value = Number(item.value ?? item.payload?.value ?? 0);
  const percent = item.payload?.percent;

  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-label">{name}</span>
      <span className="chart-tooltip-value">
        {fmt(value)}{valueLabel ? ` ${valueLabel}` : ''}
        {showPercent && percent != null ? ` (${(percent * 100).toFixed(0)}%)` : ''}
      </span>
    </div>
  );
}

function DonutCenter({ viewBox, total }: { viewBox?: Record<string, number>; total: number }) {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.35em" className="chart-donut-value">{fmt(total)}</tspan>
      <tspan x={cx} dy="1.55em" className="chart-donut-label">الإجمالي</tspan>
    </text>
  );
}

function ChartLegend({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <ul className="chart-legend">
      {data.map((item) => (
        <li key={item.name} className="chart-legend-item">
          <span className="chart-legend-dot" style={{ backgroundColor: item.color }} aria-hidden="true" />
          <span className="chart-legend-label" title={item.name}>{item.name}</span>
          <span className="chart-legend-meta">
            <strong>{fmt(item.value)}</strong>
            <small>({((item.value / total) * 100).toFixed(0)}%)</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ReportChart({ title, type, data, height }: ReportChartProps) {
  if (!data.length) {
    return (
      <div className="report-chart-card">
        <h3>{title}</h3>
        <div className="report-chart-empty">لا توجد بيانات كافية للعرض</div>
      </div>
    );
  }

  const chartData = data.map((item) => ({ name: item.label, value: item.value }));
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const legendItems = chartData.map((item, index) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const barHeight = height ?? Math.max(280, Math.min(460, chartData.length * 46 + 72));
  const pieHeight = height ?? 260;

  return (
    <div className="report-chart-card">
      <div className="report-chart-head">
        <h3>{title}</h3>
        <span className="report-chart-total">{fmt(total)}</span>
      </div>

      {type === 'pie' ? (
        <div className="chart-pie-layout">
          <div className="chart-pie-canvas" style={{ height: pieHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                  stroke="#fff"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                  <Label
                    content={(props) => (
                      <DonutCenter viewBox={props.viewBox as Record<string, number> | undefined} total={total} />
                    )}
                    position="center"
                  />
                </Pie>
                <Tooltip content={<ChartTooltip showPercent valueLabel="" />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend data={legendItems} />
        </div>
      ) : null}

      {type === 'bar' ? (
        <div className="chart-bar-wrap" style={{ height: barHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={[...chartData].reverse()}
              margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
              barCategoryGap="18%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF2" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => fmt(Number(v))}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={108}
                tick={{ fontSize: 11, fill: '#334155' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => truncate(String(v), 16)}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(34, 166, 188, 0.08)' }} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={28}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {type === 'line' ? (
        <div className="chart-line-wrap" style={{ height: height ?? 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF2" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => truncate(String(v), 10)}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tickFormatter={(v) => fmt(Number(v))}
                width={48}
              />
              <Tooltip content={<ChartTooltip valueLabel="" />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#22A6BC"
                strokeWidth={3}
                dot={{ r: 4, fill: '#22A6BC', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}
