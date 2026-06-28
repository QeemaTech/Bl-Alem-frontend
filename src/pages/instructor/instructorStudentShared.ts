import i18n from '@/i18n';
import { formatDate } from '../../utils/localeFormat';

export const enrollmentVariant = (status: string) => {
  if (status === 'COMPLETED') return 'success' as const;
  if (status === 'ACTIVE') return 'default' as const;
  if (status === 'CANCELLED') return 'rejected' as const;
  return 'default' as const;
};

export function getEnrollmentLabel(status: string): string {
  return i18n.t(`instructor.students.enrollmentStatus.${status}`, {
    ns: 'dashboard',
    defaultValue: status,
  });
}

export const fmtEnrollmentDate = (value?: string | null, lang?: string) => (
  value
    ? formatDate(value, { year: 'numeric', month: 'short', day: 'numeric' }, lang ?? i18n.language)
    : i18n.t('empty', { ns: 'liveSessions' })
);
