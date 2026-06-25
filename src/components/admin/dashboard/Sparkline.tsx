import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { useChartTheme } from './useChartTheme';

interface SparklineProps {
  data: number[];
  variant?: 'primary' | 'success' | 'warning';
}

export function Sparkline({ data, variant = 'primary' }: SparklineProps) {
  const theme = useChartTheme();
  const stroke = variant === 'success' ? theme.success : variant === 'warning' ? theme.warning : theme.primary;
  const chartData = data.map((value, index) => ({ index, value }));

  if (!data.length) return <div className="dash-sparkline is-empty" aria-hidden />;

  return (
    <div className="dash-sparkline" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2}
            fill={`url(#spark-${variant})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
