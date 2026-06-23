import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CHART_COLORS } from '../../reports/ReportChart';
import type { ChartItem } from '../../reports/ReportChart';

interface UserDetailRadarChartProps {
  title: string;
  data: ChartItem[];
  height?: number;
  embedded?: boolean;
}

export function UserDetailRadarChart({ title, data, height = 280, embedded = false }: UserDetailRadarChartProps) {
  const cardClass = `report-chart-card${embedded ? ' is-embedded' : ''}`;

  if (!data.length) {
    if (embedded) return null;
    return (
      <div className={cardClass}>
        <h3>{title}</h3>
        <div className="report-chart-empty">لا توجد بيانات كافية للعرض</div>
      </div>
    );
  }

  const chartData = data.map((item) => ({ subject: item.label, value: item.value }));

  return (
    <div className={cardClass}>
      <div className="report-chart-head">
        <h3>{title}</h3>
      </div>
      <div className="chart-line-wrap" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 16, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid stroke="#E2E8F0" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748B' }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload as { subject: string; value: number };
                return (
                  <div className="chart-tooltip">
                    <span className="chart-tooltip-label">{item.subject}</span>
                    <span className="chart-tooltip-value">{item.value}</span>
                  </div>
                );
              }}
            />
            <Radar
              dataKey="value"
              stroke={CHART_COLORS[0]}
              fill={CHART_COLORS[0]}
              fillOpacity={0.22}
              isAnimationActive={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
