import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildUserDetailMetrics } from '../components/admin/userDetail/userDetailMetrics';

export function useUserDetailMetrics(data: any) {
  const { t, i18n } = useTranslation('users');
  return useMemo(
    () => buildUserDetailMetrics(data, t, i18n.language),
    [data, t, i18n.language],
  );
}
