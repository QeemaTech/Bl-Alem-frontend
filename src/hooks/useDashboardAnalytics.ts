import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildDashboardAnalytics } from '../components/admin/dashboard/buildDashboardAnalytics';
import { createDashboardFormatters } from '../components/admin/dashboard/dashboardFormat';
import type { AdminDashboardApiData } from '../components/admin/dashboard/dashboardTypes';

export function useDashboardAnalytics(data: AdminDashboardApiData) {
  const { t, i18n } = useTranslation('dashboard');
  const fmt = useMemo(() => createDashboardFormatters(i18n.language), [i18n.language]);

  return useMemo(
    () => buildDashboardAnalytics(data, t, fmt),
    [data, t, fmt],
  );
}

export function useDashboardFormatters() {
  const { i18n } = useTranslation();
  return useMemo(() => createDashboardFormatters(i18n.language), [i18n.language]);
}
