import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, DollarSign, Image, Layers, Save, Upload,
} from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CoursePricingTypeToggle } from '../../components/ui/CoursePricingTypeToggle';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { formatMoney } from '../../utils/formatMoney';
import { mediaUrl } from '../../utils/mediaUrl';

const initial = {
  titleAr: '',
  categoryId: '',
  level: 'BEGINNER',
  type: 'RECORDED',
  language: 'ar',
  shortDescriptionAr: '',
  descriptionAr: '',
  coverImage: '',
  introVideo: '',
  whatYouWillLearn: '',
  requirements: '',
  targetAudience: '',
  price: '0',
  discountPrice: '',
  isFree: false,
} as Record<string, any>;

function CoverUploadField({
  value,
  uploading,
  onUpload,
  onRemove,
}: {
  value: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation('courses');
  const { t: tc } = useTranslation('common');
  const inputRef = useRef<HTMLInputElement>(null);
  const previewSrc = mediaUrl(value);

  return (
    <div className="course-cover-field">
      <label className="field">
        <span>{t('form.cover.label')}</span>
        <div className="course-cover-dropzone">
          <div className="course-cover-preview">
            {previewSrc ? (
              <img src={previewSrc} alt={t('form.cover.previewAlt')} />
            ) : (
              <div className="course-cover-empty">
                <Image size={32} />
                <span>{t('form.cover.empty')}</span>
                <small>{t('form.cover.hint')}</small>
              </div>
            )}
          </div>
          <div className="course-cover-actions">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              variant="secondary"
              loading={uploading}
              icon={<Upload size={16} />}
              onClick={() => inputRef.current?.click()}
            >
              {previewSrc ? t('form.cover.change') : t('form.cover.upload')}
            </Button>
            {previewSrc ? (
              <Button type="button" variant="outline" onClick={onRemove}>
                {tc('actions.remove')}
              </Button>
            ) : null}
          </div>
        </div>
        <small className="field-helper">{t('form.cover.helper')}</small>
      </label>
    </div>
  );
}

const linesToList = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);

export default function InstructorCourseFormPage() {
  const { t } = useTranslation('courses');
  const { t: tc } = useTranslation('common');
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const introVideoInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState('1');
  const [form, setForm] = useState<Record<string, any>>(initial);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingIntro, setUploadingIntro] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmSave, setConfirmSave] = useState(false);
  const [saveMode, setSaveMode] = useState<'stay' | 'builder'>('builder');

  const steps = useMemo(() => [
    { id: '1', label: t('form.steps.basic'), icon: BookOpen },
    { id: '2', label: t('form.steps.details'), icon: Layers },
    { id: '3', label: t('form.steps.pricing'), icon: DollarSign },
    { id: '4', label: t('form.steps.review'), icon: CheckCircle2 },
  ], [t]);

  const languageOptions = useMemo(() => [
    { label: t('form.languages.ar'), value: 'ar' },
    { label: t('form.languages.en'), value: 'en' },
    { label: t('form.languages.ar-en'), value: 'ar-en' },
  ], [t]);

  const levelLabel = (level: string) => t(`form.levels.${level}`, { defaultValue: level });
  const typeLabel = (type: string) => t(`form.types.${type}`, { defaultValue: type });

  useEffect(() => {
    instructorApi.categories().then(setCategories);
    if (id) {
      instructorApi.course(id).then((course) => {
        setForm({
          ...initial,
          ...course,
          categoryId: String(course.categoryId),
          price: String(course.price || 0),
          discountPrice: course.discountPrice ? String(course.discountPrice) : '',
          isFree: Number(course.price || 0) === 0,
          whatYouWillLearn: (course.whatYouWillLearn || []).join('\n'),
          requirements: (course.requirements || []).join('\n'),
          targetAudience: (course.targetAudience || []).join('\n'),
        });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const update = (key: string, value: any) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const categoryName = useMemo(
    () => categories.find((c) => String(c.id) === form.categoryId)?.nameAr || '—',
    [categories, form.categoryId],
  );

  const progress = useMemo(() => {
    let filled = 0;
    if (form.titleAr?.trim()) filled += 1;
    if (form.categoryId) filled += 1;
    if (form.shortDescriptionAr?.trim()) filled += 1;
    if (form.coverImage) filled += 1;
    if (linesToList(form.whatYouWillLearn).length) filled += 1;
    if (form.isFree || Number(form.price) > 0) filled += 1;
    return Math.round((filled / 6) * 100);
  }, [form]);

  const validateStep = (current: string) => {
    const next: Record<string, string> = {};
    if (current === '1') {
      if (!form.titleAr?.trim()) next.titleAr = 'أدخل عنوان الكورس.';
      if (!form.categoryId) next.categoryId = 'اختر التصنيف.';
      if (!form.shortDescriptionAr?.trim()) next.shortDescriptionAr = 'أضف وصفاً مختصراً.';
    }
    if (current === '2') {
      if (!linesToList(form.whatYouWillLearn).length) {
        next.whatYouWillLearn = 'أضف نقطة واحدة على الأقل.';
      }
    }
    if (current === '3') {
      if (!form.isFree) {
        const price = Number(form.price);
        if (Number.isNaN(price) || price < 0) next.price = 'أدخل سعراً صالحاً.';
        if (form.discountPrice) {
          const discount = Number(form.discountPrice);
          if (Number.isNaN(discount) || discount < 0) next.discountPrice = 'سعر الخصم غير صالح.';
          else if (discount >= price) next.discountPrice = 'يجب أن يكون سعر الخصم أقل من السعر.';
        }
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep(String(Number(step) + 1));
  };

  const goPrev = () => setStep(String(Number(step) - 1));

  const uploadCover = async (file: File) => {
    setUploadingCover(true);
    try {
      const uploaded = await instructorApi.upload('image', file);
      update('coverImage', uploaded.url);
      showToast('تم رفع صورة الغلاف.', 'success');
    } catch {
      showToast('تعذّر رفع الصورة. حاول مرة أخرى.', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const uploadIntroVideo = async (file: File) => {
    setUploadingIntro(true);
    try {
      const uploaded = await instructorApi.upload('video', file);
      update('introVideo', uploaded.url);
      showToast('تم رفع فيديو المقدمة.', 'success');
    } catch {
      showToast('تعذّر رفع الفيديو. حاول مرة أخرى.', 'error');
    } finally {
      setUploadingIntro(false);
    }
  };

  const buildPayload = () => ({
    titleAr: form.titleAr?.trim(),
    categoryId: Number(form.categoryId),
    level: form.level,
    type: form.type,
    language: form.language,
    shortDescriptionAr: form.shortDescriptionAr || null,
    descriptionAr: form.descriptionAr || null,
    coverImage: form.coverImage || null,
    introVideo: form.introVideo || null,
    whatYouWillLearn: form.whatYouWillLearn,
    requirements: form.requirements || null,
    targetAudience: form.targetAudience || null,
    isFree: Boolean(form.isFree),
    price: form.isFree ? 0 : Number(form.price || 0),
    discountPrice: form.isFree || !form.discountPrice ? null : Number(form.discountPrice),
  });

  const validateAllSteps = () => {
    const ok1 = validateStep('1');
    const ok2 = validateStep('2');
    const ok3 = validateStep('3');
    if (!ok1) setStep('1');
    else if (!ok2) setStep('2');
    else if (!ok3) setStep('3');
    return ok1 && ok2 && ok3;
  };

  const requestSave = (mode: 'stay' | 'builder') => {
    if (step !== '4') return;
    if (!validateAllSteps()) {
      showToast('راجع الحقول المطلوبة قبل الحفظ.', 'error');
      return;
    }
    setSaveMode(mode);
    setConfirmSave(true);
  };

  const save = async () => {
    setConfirmSave(false);
    setSubmitting(true);
    try {
      const payload = buildPayload();
      const course = isEdit && id
        ? await instructorApi.updateCourse(id, payload)
        : await instructorApi.createCourse(payload);
      showToast('تم حفظ الكورس كمسودة.', 'success');
      if (saveMode === 'builder') {
        navigate(`/instructor/courses/${course.id}/builder`);
      } else if (!isEdit) {
        navigate(`/instructor/courses/${course.id}/edit`);
      }
    } catch {
      showToast('تعذّر حفظ الكورس.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (step !== '4') return;
    requestSave('builder');
  };

  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' && step !== '4') event.preventDefault();
  };

  const displayPrice = form.isFree
    ? 'مجاني'
    : form.discountPrice
      ? formatMoney(form.discountPrice)
      : formatMoney(form.price);

  if (loading) {
    return (
      <div className="page-grid">
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  return (
    <div className="page-grid course-form-page">
      <PageHeader
        title={isEdit ? t('form.editTitle') : t('form.createTitle')}
        subtitle={t('form.subtitle')}
        breadcrumb={[
          { label: t('management.title'), to: '/instructor/courses' },
          { label: isEdit ? tc('actions.edit') : tc('actions.create') },
        ]}
      />

      <div className="course-form-progress">
        <div className="course-form-progress-bar">
          <div className="course-form-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="course-form-progress-label">اكتمال البيانات: {progress}%</span>
      </div>

      <nav className="wizard-steps course-wizard-steps" aria-label="خطوات إنشاء الكورس">
        {steps.map((s) => {
          const Icon = s.icon;
          const num = Number(s.id);
          const current = Number(step);
          const done = num < current;
          const active = s.id === step;
          return (
            <button
              key={s.id}
              type="button"
              className={`wizard-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}
              onClick={() => {
                if (done || active) setStep(s.id);
                else if (num === current + 1 && validateStep(step)) setStep(s.id);
              }}
            >
              <span className="wizard-step-num">
                {done ? <CheckCircle2 size={14} /> : num}
              </span>
              <Icon size={16} />
              {s.label}
            </button>
          );
        })}
      </nav>

      <form onSubmit={handleFormSubmit} onKeyDown={handleFormKeyDown} className="page-grid">
        <Card className="course-form-card">
          {step === '1' ? (
            <>
              <h2 className="course-form-section-title">البيانات الأساسية</h2>
              <p className="course-form-section-desc">المعلومات التي يراها الطالب في صفحة الكورس.</p>
              <div className="form-grid">
                <Input
                  label="عنوان الكورس"
                  value={form.titleAr}
                  onChange={(e) => update('titleAr', e.target.value)}
                  placeholder="مثال: أساسيات JavaScript للمبتدئين"
                  error={errors.titleAr}
                  required
                />
                <Select
                  label="التصنيف"
                  value={form.categoryId}
                  onChange={(e) => update('categoryId', e.target.value)}
                  error={errors.categoryId}
                  options={[
                    { label: 'اختر التصنيف', value: '' },
                    ...categories.map((c) => ({ label: c.nameAr, value: String(c.id) })),
                  ]}
                />
                <Select
                  label="المستوى"
                  value={form.level}
                  onChange={(e) => update('level', e.target.value)}
                  options={[
                    { label: 'مبتدئ', value: 'BEGINNER' },
                    { label: 'متوسط', value: 'INTERMEDIATE' },
                    { label: 'متقدم', value: 'ADVANCED' },
                  ]}
                />
                <Select
                  label="النوع"
                  value={form.type}
                  onChange={(e) => update('type', e.target.value)}
                  options={[
                    { label: 'مسجل', value: 'RECORDED' },
                    { label: 'مباشر', value: 'LIVE' },
                    { label: 'مختلط', value: 'MIXED' },
                  ]}
                />
                <Select
                  label="اللغة"
                  value={form.language}
                  onChange={(e) => update('language', e.target.value)}
                  options={languageOptions}
                />
                <CoverUploadField
                  value={form.coverImage}
                  uploading={uploadingCover}
                  onUpload={uploadCover}
                  onRemove={() => update('coverImage', '')}
                />
                <Card className="stack-sm">
                  <Input
                    label="فيديو المقدمة (رابط)"
                    value={form.introVideo}
                    onChange={(e) => update('introVideo', e.target.value)}
                    placeholder="https://"
                    helper="سيظهر في صفحة تفاصيل الكورس كفيديو تعريفي."
                  />
                  <label className="field">
                    <span>رفع فيديو المقدمة</span>
                    <input
                      ref={introVideoInputRef}
                      type="file"
                      accept="video/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadIntroVideo(file);
                        e.target.value = '';
                      }}
                    />
                    <small className="field-helper">MP4 أو MOV بحجم مناسب للعرض التعريفي.</small>
                    <Button type="button" variant="secondary" loading={uploadingIntro} icon={<Upload size={16} />} onClick={() => introVideoInputRef.current?.click()}>
                      رفع الفيديو
                    </Button>
                  </label>
                </Card>
                <Textarea
                  label="وصف مختصر"
                  value={form.shortDescriptionAr}
                  onChange={(e) => update('shortDescriptionAr', e.target.value)}
                  placeholder="جملة أو جملتان تلخصان محتوى الكورس..."
                  error={errors.shortDescriptionAr}
                  rows={3}
                />
                <Textarea
                  label="الوصف التفصيلي"
                  value={form.descriptionAr}
                  onChange={(e) => update('descriptionAr', e.target.value)}
                  placeholder="اشرح محتوى الكورس، منهجه، وما يميزه..."
                  rows={5}
                />
              </div>
            </>
          ) : null}

          {step === '2' ? (
            <>
              <h2 className="course-form-section-title">تفاصيل التعلم</h2>
              <p className="course-form-section-desc">سطر واحد لكل نقطة — تظهر في صفحة الكورس للطالب.</p>
              <div className="form-grid form-grid-single">
                <Textarea
                  label="ماذا سيتعلم الطالب؟"
                  value={form.whatYouWillLearn}
                  onChange={(e) => update('whatYouWillLearn', e.target.value)}
                  placeholder={'فهم أساسيات JavaScript\nبناء تطبيقات تفاعلية\nالتعامل مع DOM'}
                  error={errors.whatYouWillLearn}
                  rows={6}
                />
                <Textarea
                  label="المتطلبات"
                  value={form.requirements}
                  onChange={(e) => update('requirements', e.target.value)}
                  placeholder={'معرفة أساسية بالحاسوب\nلا يلزم خبرة برمجية سابقة'}
                  rows={4}
                />
                <Textarea
                  label="الفئة المستهدفة"
                  value={form.targetAudience}
                  onChange={(e) => update('targetAudience', e.target.value)}
                  placeholder={'المبتدئون في البرمجة\nطلاب علوم الحاسب'}
                  rows={4}
                />
              </div>
            </>
          ) : null}

          {step === '3' ? (
            <>
              <h2 className="course-form-section-title">التسعير</h2>
              <p className="course-form-section-desc">حدّد ما إذا كان الكورس مجانياً أو مدفوعاً.</p>
              <div className="form-grid course-pricing-grid">
                <CoursePricingTypeToggle
                  isFree={Boolean(form.isFree)}
                  onChange={(free) => {
                    update('isFree', free);
                    if (free) {
                      update('price', '0');
                      update('discountPrice', '');
                    }
                  }}
                />
                {!form.isFree ? (
                  <>
                    <Input
                      label="السعر (ج.م)"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.price}
                      onChange={(e) => update('price', e.target.value)}
                      error={errors.price}
                    />
                    <Input
                      label="سعر الخصم (اختياري)"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.discountPrice}
                      onChange={(e) => update('discountPrice', e.target.value)}
                      error={errors.discountPrice}
                      helper="يظهر كسعر مخفّض في صفحة الكورس."
                    />
                  </>
                ) : null}
              </div>
              {!form.isFree && form.price ? (
                <div className="course-price-preview">
                  <span>معاينة السعر:</span>
                  {form.discountPrice ? (
                    <>
                      <strong>{formatMoney(form.discountPrice)}</strong>
                      <del>{formatMoney(form.price)}</del>
                    </>
                  ) : (
                    <strong>{formatMoney(form.price)}</strong>
                  )}
                </div>
              ) : null}
            </>
          ) : null}

          {step === '4' ? (
            <>
              <h2 className="course-form-section-title">مراجعة قبل الحفظ</h2>
              <p className="course-form-section-desc">تأكد من صحة البيانات — يُحفظ الكورس كمسودة.</p>
              <div className="course-review-layout">
                <div className="course-review-cover-wrap">
                  {form.coverImage ? (
                    <img src={mediaUrl(form.coverImage)} alt="" className="course-review-cover-img" />
                  ) : (
                    <div className="course-review-cover-empty">
                      <Image size={40} />
                      <span>بدون صورة غلاف</span>
                    </div>
                  )}
                </div>
                <div className="course-review-body">
                  <div className="course-review-head">
                    <div className="course-review-title-row">
                      <Badge variant="default">مسودة</Badge>
                      <h3>{form.titleAr || 'عنوان الكورس'}</h3>
                    </div>
                  </div>
                  <p className="course-review-desc">{form.shortDescriptionAr || '—'}</p>
                  <div className="course-review-meta">
                    <span>{categoryName}</span>
                    <span>{levelLabel(form.level)}</span>
                    <span>{typeLabel(form.type)}</span>
                    <span>{languageOptions.find((l) => l.value === form.language)?.label || form.language}</span>
                  </div>
                  {form.introVideo ? (
                    <video controls src={mediaUrl(form.introVideo)} className="course-review-video" />
                  ) : null}
                  <p className="course-review-price">
                    السعر: <strong>{displayPrice}</strong>
                  </p>
                  {linesToList(form.whatYouWillLearn).length ? (
                    <div className="course-review-list">
                      <h4>ماذا سيتعلم الطالب</h4>
                      <ul>
                        {linesToList(form.whatYouWillLearn).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <p className="course-review-hint">
                    راجع جميع البيانات بعناية. لن يتم الحفظ إلا عند الضغط على أحد أزرار الحفظ أدناه.
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </Card>

        <div className="wizard-actions course-form-actions">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="course-form-prev-btn"
            disabled={step === '1'}
            icon={<ArrowLeft size={18} />}
            onClick={goPrev}
          >
            السابق
          </Button>
          <div className="course-form-actions-group">
            {step !== '4' ? (
              <Button type="button" size="lg" icon={<ArrowRight size={18} />} onClick={goNext}>
                التالي
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  loading={submitting}
                  icon={<Save size={18} />}
                  onClick={() => requestSave('stay')}
                >
                  {isEdit ? 'حفظ التعديلات' : 'حفظ كمسودة'}
                </Button>
                <Button type="submit" size="lg" loading={submitting} icon={<Save size={18} />}>
                  حفظ والمتابعة للبناء
                </Button>
              </>
            )}
          </div>
        </div>
      </form>

      <ConfirmDialog
        isOpen={confirmSave}
        title="تأكيد حفظ الكورس"
        message={
          saveMode === 'builder'
            ? 'سيتم حفظ الكورس كمسودة ثم الانتقال لمنشئ المحتوى لإضافة الأقسام والدروس.'
            : 'سيتم حفظ الكورس كمسودة والبقاء في هذه الصفحة.'
        }
        confirmLabel="تأكيد الحفظ"
        variant="primary"
        onConfirm={save}
        onCancel={() => setConfirmSave(false)}
      />
    </div>
  );
}
