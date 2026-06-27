import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../utils/localeFormat';

export function useAdminReviewLabels() {
  const { t, i18n } = useTranslation('reviews');
  const lang = i18n.language;

  return useMemo(() => {
    const fmtReviewDate = (value: string) => formatDateTime(value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }, lang);

    const starLabel = (count: number) => (
      count === 1 ? t('charts.oneStar') : t('charts.stars', { count })
    );

    const starsAriaLabel = (rating: number) => t('labels.starsAria', { rating });
    const ratingOf = (rating: number) => t('labels.ratingOf', { rating });

    return {
      fmtReviewDate,
      starLabel,
      starsAriaLabel,
      ratingOf,
      empty: t('empty'),
      lang,
    };
  }, [t, lang]);
}
