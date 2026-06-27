import { useTranslation } from 'react-i18next';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useChartTheme } from '../../../hooks/useChartTheme';
import type { ChartItem } from '../../reports/ReportChart';

interface UserDetailRadarChartProps {
  title: string;
  data: ChartItem[];
  height?: number;
  embedded?: boolean;
}

export function UserDetailRadarChart({ title, data, height = 280, embedded = false }: UserDetailRadarChartProps) {
  const { t } = useTranslation('common');
  const theme = useChartTheme();
  const cardClass = `report-chart-card${embedded ? ' is-embedded' : ''}`;

  if (!data.length) {
    if (embedded) return null;
    return (
      <div className={cardClass}>
        <h3>{title}</h3>
        <div className="report-chart-empty">{t('chart.noData')}</div>
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
            <PolarGrid stroke={theme.grid} />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: theme.text }} />
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
              stroke={theme.primary}
              fill={theme.primary}
              fillOpacity={0.22}
              isAnimationActive={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
