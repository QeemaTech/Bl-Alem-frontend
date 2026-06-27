import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useChartTheme } from '../../hooks/useChartTheme';
import { formatNumber } from '../../utils/localeFormat';

export const CHART_COLORS = [
  '#006874',
  '#146c2e',
  '#8a5a00',
  '#ba1a1a',
  '#7c3aed',
  '#0284c7',
  '#db2777',
  '#64748b',
];

export interface ChartItem {
  label: string;
  value: number;
  color?: string;
}

interface ReportChartProps {
  title: string;
  type: 'bar' | 'line' | 'pie' | 'area';
  data: ChartItem[];
  height?: number;
  barDomain?: [number, number | 'auto'];
  hideTotal?: boolean;
  embedded?: boolean;
  barGradient?: boolean;
  showBarValueLabels?: boolean;
}

const fmt = (value: number, language?: string) => formatNumber(Number(value || 0), undefined, language);

const primaryGradientColor = (
  rank: number,
  total: number,
  darkEnd: string,
  lightEnd: string,
) => {
  if (total <= 1) return darkEnd;
  const t = rank / (total - 1);
  const parse = (hex: string) => {
    const n = hex.replace('#', '');
    return {
      r: parseInt(n.slice(0, 2), 16),
      g: parseInt(n.slice(2, 4), 16),
      b: parseInt(n.slice(4, 6), 16),
    };
  };
  const start = parse(darkEnd);
  const end = parse(lightEnd);
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
};

const truncate = (text: string, max = 14) => (
  text.length > max ? `${text.slice(0, max)}…` : text
);

const LATIN_SEGMENT = /([A-Za-z][A-Za-z0-9.+#\-_/]*[A-Za-z0-9]|[A-Za-z0-9]+)/g;

function isLatinSegment(value: string) {
  return /^[A-Za-z0-9]/.test(value);
}

function MixedScriptText({ text }: { text: string }) {
  const parts = text.split(LATIN_SEGMENT).filter(Boolean);
  if (parts.length <= 1) {
    return (
      <span className="chart-bar-y-tick" title={text} style={{ unicodeBidi: 'plaintext' }}>
        {text}
      </span>
    );
  }
  return (
    <span className="chart-bar-y-tick" title={text} dir="rtl">
      {parts.map((part, index) => (
        isLatinSegment(part)
          ? <span key={`${part}-${index}`} className="chart-mixed-ltr" dir="ltr">{part}</span>
          : <span key={`${part}-${index}`}>{part}</span>
      ))}
    </span>
  );
}

interface BarCategoryTickProps {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string };
  width: number;
}

function BarCategoryTick({ x = 0, y = 0, payload, width }: BarCategoryTickProps) {
  const label = String(payload?.value ?? '');
  const xPos = typeof x === 'number' ? x : Number(x) || 0;
  const yPos = typeof y === 'number' ? y : Number(y) || 0;
  return (
    <g transform={`translate(${xPos},${yPos})`}>
      <foreignObject x={-(width - 6)} y={-20} width={width - 10} height={40}>
        <div>
          <MixedScriptText text={label} />
        </div>
      </foreignObject>
    </g>
  );
}

interface TooltipPayload {
  name?: string;
  value?: number;
  payload?: { name?: string; value?: number; percent?: number };
}

function ChartTooltip({
  active,
  payload,
  valueLabel,
  showPercent,
  language,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  valueLabel?: string;
  showPercent?: boolean;
  language?: string;
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
        {fmt(value, language)}{valueLabel ? ` ${valueLabel}` : ''}
        {showPercent && percent != null ? ` (${(percent * 100).toFixed(0)}%)` : ''}
      </span>
    </div>
  );
}

function DonutCenter({ viewBox, total, totalLabel, language }: { viewBox?: Record<string, number>; total: number; totalLabel: string; language?: string }) {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.35em" className="chart-donut-value">{fmt(total, language)}</tspan>
      <tspan x={cx} dy="1.55em" className="chart-donut-label">{totalLabel}</tspan>
    </text>
  );
}

function ChartLegend({ data, language }: { data: { name: string; value: number; color: string }[]; language?: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <ul className="chart-legend">
      {data.map((item) => (
        <li key={item.name} className="chart-legend-item">
          <span className="chart-legend-dot" style={{ backgroundColor: item.color }} aria-hidden="true" />
          <span className="chart-legend-label" title={item.name}>{item.name}</span>
          <span className="chart-legend-meta">
            <strong>{fmt(item.value, language)}</strong>
            <small>({((item.value / total) * 100).toFixed(0)}%)</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ReportChart({
  title,
  type,
  data,
  height,
  barDomain,
  hideTotal,
  embedded = false,
  barGradient = false,
  showBarValueLabels = false,
}: ReportChartProps) {
  const { t, i18n } = useTranslation('common');
  const theme = useChartTheme();
  const language = i18n.language;
  const chartValueLabel = t('chart.value');
  const chartTotalLabel = t('chart.total');
  const cardClass = `report-chart-card${embedded ? ' is-embedded' : ''}`;
  const tickStyle = { fontSize: 11, fill: theme.text };
  const tickStyleSm = { fontSize: 10, fill: theme.text };
  const gradientId = `areaPrimary-${theme.primary.replace('#', '')}`;

  if (!data.length) {
    if (embedded) return null;
    return (
      <div className={cardClass}>
        <h3>{title}</h3>
        <div className="report-chart-empty">{t('chart.noData')}</div>
      </div>
    );
  }

  const chartData = data.map((item) => ({ name: item.label, value: item.value, color: item.color }));
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const sortedByValue = [...chartData].sort((a, b) => b.value - a.value);
  const barColorByName = new Map(
    sortedByValue.map((item, index) => [
      item.name,
      barGradient
        ? primaryGradientColor(index, sortedByValue.length, theme.barGradientDark, theme.barGradientLight)
        : theme.colors[index % theme.colors.length],
    ]),
  );
  const legendItems = chartData.map((item, index) => ({
    ...item,
    color: item.color || (barGradient
      ? (barColorByName.get(item.name) || theme.colors[0])
      : theme.colors[index % theme.colors.length]),
  }));

  const barPerItem = 50;
  const barBase = 40;
  const computedBarHeight = barBase + chartData.length * barPerItem;
  const barScrollThreshold = 8;
  const barScrollMaxHeight = barBase + barScrollThreshold * barPerItem;
  const barHeight = height ?? computedBarHeight;
  const barWrapScrollable = !height && chartData.length > barScrollThreshold;
  const barWrapHeight = barWrapScrollable ? barScrollMaxHeight : barHeight;

  const longestLabel = chartData.reduce((max, item) => Math.max(max, String(item.name).length), 0);
  const yAxisWidth = Math.min(200, Math.max(96, Math.ceil(longestLabel * 5.2)));
  const maxValueDigits = String(Math.max(...chartData.map((item) => item.value), 0)).length;
  const barValueMargin = showBarValueLabels ? Math.max(28, 12 + maxValueDigits * 9) : 12;
  const barLeftMargin = Math.max(12, 8 + maxValueDigits * 4);
  const pieHeight = height ?? 260;
  const barDisplayData = [...chartData].reverse();

  return (
    <div className={cardClass}>
      <div className="report-chart-head">
        {title ? <h3>{title}</h3> : <span />}
        {!hideTotal ? <span className="report-chart-total">{fmt(total, language)}</span> : null}
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
                  stroke={theme.surfaceStroke}
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.color || theme.colors[index % theme.colors.length]}
                    />
                  ))}
                  <Label
                    content={(props) => (
                      <DonutCenter
                        viewBox={props.viewBox as Record<string, number> | undefined}
                        total={total}
                        totalLabel={chartTotalLabel}
                        language={language}
                      />
                    )}
                    position="center"
                  />
                </Pie>
                <Tooltip content={<ChartTooltip showPercent valueLabel="" language={language} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend data={legendItems} language={language} />
        </div>
      ) : null}

      {type === 'bar' ? (
        <div
          className={`chart-bar-wrap${barGradient ? ' is-gradient' : ''}${barWrapScrollable ? ' is-auto-height' : ''}`}
          style={{ height: barWrapHeight }}
        >
          <ResponsiveContainer width="100%" height={barHeight}>
            <BarChart
              layout="vertical"
              data={barDisplayData}
              margin={{
                top: 12,
                right: barValueMargin,
                left: barLeftMargin,
                bottom: 8,
              }}
              barCategoryGap="16%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} horizontal={false} />
              <XAxis
                type="number"
                domain={barDomain || [0, 'auto']}
                tick={tickStyleSm}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => fmt(Number(v), language)}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={yAxisWidth}
                tick={(props) => <BarCategoryTick {...props} width={yAxisWidth} />}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip valueLabel={chartValueLabel} language={language} />}
                cursor={{ fill: theme.cursorFill }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={24}>
                {barDisplayData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color || barColorByName.get(entry.name) || theme.colors[0]}
                  />
                ))}
                {showBarValueLabels ? (
                  <LabelList
                    dataKey="value"
                    position="right"
                    fill={theme.text}
                    fontSize={11}
                    fontWeight={600}
                    offset={6}
                    formatter={(value) => fmt(Number(value ?? 0), language)}
                  />
                ) : null}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {type === 'line' ? (
        <div className="chart-line-wrap" style={{ height: height ?? 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
              <XAxis
                dataKey="name"
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => truncate(String(v), 10)}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tickFormatter={(v) => fmt(Number(v), language)}
                width={48}
              />
              <Tooltip content={<ChartTooltip valueLabel="" language={language} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={theme.primary}
                strokeWidth={3}
                dot={{ r: 4, fill: theme.primary, strokeWidth: 2, stroke: theme.surfaceStroke }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {type === 'area' ? (
        <div className="chart-line-wrap" style={{ height: height ?? 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={theme.primary} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
              <XAxis
                dataKey="name"
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => truncate(String(v), 10)}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tickFormatter={(v) => fmt(Number(v), language)}
                width={48}
              />
              <Tooltip content={<ChartTooltip valueLabel="" language={language} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={theme.primary}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}
