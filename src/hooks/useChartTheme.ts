import { useMemo } from 'react';
import { useTheme } from '../store/ThemeContext';

export function useChartTheme() {
  const { resolvedTheme } = useTheme();

  return useMemo(() => {
    const dark = resolvedTheme === 'dark';
    return {
      primary: dark ? '#82d3e0' : '#006874',
      secondary: dark ? '#9eeffd' : '#22a6bc',
      success: dark ? '#6dd58c' : '#146c2e',
      warning: dark ? '#ffbf0f' : '#8a5a00',
      error: dark ? '#ffb4ab' : '#ba1a1a',
      muted: dark ? '#94a3b8' : '#64748b',
      grid: dark ? '#334155' : '#e8eef2',
      text: dark ? '#94a3b8' : '#64748b',
      label: dark ? '#cbd5e1' : '#475569',
      surface: dark ? '#1e293b' : '#ffffff',
      surfaceStroke: dark ? '#334155' : '#ffffff',
      tooltipBg: dark ? '#273449' : '#ffffff',
      tooltipBorder: dark ? '#475569' : '#e2e8f0',
      cursorFill: dark ? 'rgba(130, 211, 224, 0.12)' : 'rgba(0, 104, 116, 0.08)',
      colors: dark
        ? ['#82d3e0', '#6dd58c', '#ffbf0f', '#ffb4ab', '#c4b5fd', '#38bdf8', '#f472b6', '#94a3b8']
        : ['#006874', '#146c2e', '#8a5a00', '#ba1a1a', '#7c3aed', '#0284c7', '#db2777', '#64748b'],
      barGradientDark: '#0e7490',
      barGradientLight: dark ? '#164e63' : '#bae6f0',
    };
  }, [resolvedTheme]);
}
