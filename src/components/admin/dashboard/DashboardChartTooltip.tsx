import { useDashboardFormatters } from '../../../hooks/useDashboardAnalytics';

interface TooltipPayload {
  name?: string;
  value?: number;
  color?: string;
  payload?: { name?: string; value?: number; percent?: number; students?: number; instructors?: number };
}

interface DashboardChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  valueLabel?: string;
  showPercent?: boolean;
  dual?: boolean;
  studentsLabel?: string;
  instructorsLabel?: string;
}

export function DashboardChartTooltip({
  active,
  payload,
  label,
  valueLabel = '',
  showPercent,
  dual,
  studentsLabel = 'Students',
  instructorsLabel = 'Instructors',
}: DashboardChartTooltipProps) {
  const { fmtNum } = useDashboardFormatters();

  if (!active || !payload?.length) return null;

  if (dual) {
    const row = payload[0]?.payload;
    return (
      <div className="admin-dash-tooltip" role="tooltip">
        <span className="admin-dash-tooltip-label">{label}</span>
        <span className="admin-dash-tooltip-row">
          <span className="admin-dash-tooltip-dot is-students" aria-hidden />
          {studentsLabel}: <strong>{fmtNum(row?.students ?? 0)}</strong>
        </span>
        <span className="admin-dash-tooltip-row">
          <span className="admin-dash-tooltip-dot is-instructors" aria-hidden />
          {instructorsLabel}: <strong>{fmtNum(row?.instructors ?? 0)}</strong>
        </span>
      </div>
    );
  }

  const item = payload[0];
  const name = item.name || item.payload?.name || label || '—';
  const value = Number(item.value ?? item.payload?.value ?? 0);
  const percent = item.payload?.percent;

  return (
    <div className="admin-dash-tooltip" role="tooltip">
      <span className="admin-dash-tooltip-label">{name}</span>
      <span className="admin-dash-tooltip-value">
        {fmtNum(value)}{valueLabel ? ` ${valueLabel}` : ''}
        {showPercent && percent != null ? ` (${(percent * 100).toFixed(0)}%)` : ''}
      </span>
    </div>
  );
}
