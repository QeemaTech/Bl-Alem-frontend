import { useTranslation } from 'react-i18next';

interface CoursePricingTypeToggleProps {
  isFree: boolean;
  onChange: (free: boolean) => void;
  helper?: string;
}

export function CoursePricingTypeToggle({ isFree, onChange, helper }: CoursePricingTypeToggleProps) {
  const { t, i18n } = useTranslation('courses');

  const defaultHelper = isFree ? t('form.pricingType.helperFree') : t('form.pricingType.helperPaid');

  return (
    <div className="field course-pricing-type-field">
      <span>{t('form.pricingType.label')}</span>
      <div
        className="course-pricing-type-toggle"
        role="group"
        aria-label={t('form.pricingType.ariaLabel')}
        dir={i18n.dir()}
      >
        <button
          type="button"
          className={`course-pricing-type-btn ${isFree ? 'active' : ''}`}
          aria-pressed={isFree}
          onClick={() => onChange(true)}
        >
          {t('form.pricingType.free')}
        </button>
        <button
          type="button"
          className={`course-pricing-type-btn ${!isFree ? 'active' : ''}`}
          aria-pressed={!isFree}
          onClick={() => onChange(false)}
        >
          {t('form.pricingType.paid')}
        </button>
      </div>
      <small className="field-helper">{helper ?? defaultHelper}</small>
    </div>
  );
}
