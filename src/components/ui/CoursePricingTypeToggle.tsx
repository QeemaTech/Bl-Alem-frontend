interface CoursePricingTypeToggleProps {
  isFree: boolean;
  onChange: (free: boolean) => void;
  helper?: string;
}

export function CoursePricingTypeToggle({ isFree, onChange, helper }: CoursePricingTypeToggleProps) {
  const defaultHelper = isFree
    ? 'الكورس متاح للطلاب بدون رسوم تسجيل.'
    : 'حدّد السعر والخصم في الحقول أدناه.';

  return (
    <div className="field course-pricing-type-field">
      <span>نوع الكورس</span>
      <div
        className="course-pricing-type-toggle"
        role="group"
        aria-label="نوع الكورس"
        dir="rtl"
      >
        <button
          type="button"
          className={`course-pricing-type-btn ${isFree ? 'active' : ''}`}
          aria-pressed={isFree}
          onClick={() => onChange(true)}
        >
          مجاني
        </button>
        <button
          type="button"
          className={`course-pricing-type-btn ${!isFree ? 'active' : ''}`}
          aria-pressed={!isFree}
          onClick={() => onChange(false)}
        >
          مدفوع
        </button>
      </div>
      <small className="field-helper">{helper ?? defaultHelper}</small>
    </div>
  );
}
