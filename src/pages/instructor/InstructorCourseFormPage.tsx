import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, DollarSign, Image, Layers, NavChevronBack,
  NavChevronForward, Save, Upload,
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
import { localizedCategoryName, localizedCourseList, localizedCourseShortDescription, localizedCourseTitle } from '../../utils/localizedContent';
import { mediaUrl } from '../../utils/mediaUrl';

const initial = {
  titleAr: '',
  titleEn: '',
  categoryId: '',
  level: 'BEGINNER',
  type: 'RECORDED',
  language: 'ar',
  shortDescriptionAr: '',
  shortDescriptionEn: '',
  descriptionAr: '',
  descriptionEn: '',
  coverImage: '',
  introVideo: '',
  whatYouWillLearn: '',
  whatYouWillLearnEn: '',
  requirements: '',
  requirementsEn: '',
  targetAudience: '',
  targetAudienceEn: '',
  price: '0',
  discountPrice: '',
  isFree: false,
} as Record<string, any>;

const requiresArabic = (language: string) => language === 'ar' || language === 'ar-en';
const requiresEnglish = (language: string) => language === 'en' || language === 'ar-en';

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
  const { t, i18n } = useTranslation('courses');
  const { t: tc } = useTranslation('common');
  const lang = i18n.language;
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

  const isLtr = lang.startsWith('en');
  const bilingualRowClass = `course-bilingual-row${isLtr ? ' course-bilingual-row--en-first' : ''}`;
  const navIconPosition = isLtr ? 'end' as const : 'start' as const;
  const prevIcon = isLtr ? <NavChevronBack size={18} /> : <ArrowLeft size={18} />;
  const nextIcon = isLtr ? <NavChevronForward size={18} /> : <ArrowRight size={18} />;

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
          titleEn: course.titleEn || '',
          shortDescriptionEn: course.shortDescriptionEn || '',
          descriptionEn: course.descriptionEn || '',
          categoryId: String(course.categoryId),
          price: String(course.price || 0),
          discountPrice: course.discountPrice ? String(course.discountPrice) : '',
          isFree: Number(course.price || 0) === 0,
          whatYouWillLearn: (course.whatYouWillLearn || []).join('\n'),
          whatYouWillLearnEn: (course.whatYouWillLearnEn || []).join('\n'),
          requirements: (course.requirements || []).join('\n'),
          requirementsEn: (course.requirementsEn || []).join('\n'),
          targetAudience: (course.targetAudience || []).join('\n'),
          targetAudienceEn: (course.targetAudienceEn || []).join('\n'),
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

  const levelOptions = useMemo(
    () => ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((value) => ({
      label: t(`form.levels.${value}`),
      value,
    })),
    [t, lang],
  );

  const typeOptions = useMemo(
    () => ['RECORDED', 'LIVE', 'MIXED'].map((value) => ({
      label: t(`form.types.${value}`),
      value,
    })),
    [t, lang],
  );

  const categoryOptions = useMemo(
    () => [
      { label: t('form.fields.categoryPlaceholder'), value: '' },
      ...categories.map((c) => ({
        label: localizedCategoryName(c, lang),
        value: String(c.id),
      })),
    ],
    [categories, t, lang],
  );

  const categoryName = useMemo(() => {
    const cat = categories.find((c) => String(c.id) === form.categoryId);
    return cat ? localizedCategoryName(cat, lang) : '—';
  }, [categories, form.categoryId, lang]);

  const progress = useMemo(() => {
    const needsAr = requiresArabic(form.language);
    const needsEn = requiresEnglish(form.language);
    const checks: boolean[] = [];
    if (needsAr) checks.push(Boolean(form.titleAr?.trim()));
    if (needsEn) checks.push(Boolean(form.titleEn?.trim()));
    checks.push(Boolean(form.categoryId));
    if (needsAr) checks.push(Boolean(form.shortDescriptionAr?.trim()));
    if (needsEn) checks.push(Boolean(form.shortDescriptionEn?.trim()));
    checks.push(Boolean(form.coverImage));
    if (needsAr) checks.push(linesToList(form.whatYouWillLearn).length > 0);
    if (needsEn) checks.push(linesToList(form.whatYouWillLearnEn).length > 0);
    checks.push(form.isFree || Number(form.price) > 0);
    const filled = checks.filter(Boolean).length;
    return checks.length ? Math.round((filled / checks.length) * 100) : 0;
  }, [form]);

  const validateStep = (current: string) => {
    const next: Record<string, string> = {};
    const needsAr = requiresArabic(form.language);
    const needsEn = requiresEnglish(form.language);
    if (current === '1') {
      if (needsAr && !form.titleAr?.trim()) next.titleAr = t('form.validation.titleAr');
      if (needsEn && !form.titleEn?.trim()) next.titleEn = t('form.validation.titleEn');
      if (!form.categoryId) next.categoryId = t('form.validation.category');
      if (needsAr && !form.shortDescriptionAr?.trim()) next.shortDescriptionAr = t('form.validation.shortDescAr');
      if (needsEn && !form.shortDescriptionEn?.trim()) next.shortDescriptionEn = t('form.validation.shortDescEn');
    }
    if (current === '2') {
      if (needsAr && !linesToList(form.whatYouWillLearn).length) {
        next.whatYouWillLearn = t('form.validation.whatYouLearn');
      }
      if (needsEn && !linesToList(form.whatYouWillLearnEn).length) {
        next.whatYouWillLearnEn = t('form.validation.whatYouLearnEn');
      }
    }
    if (current === '3') {
      if (!form.isFree) {
        const price = Number(form.price);
        if (Number.isNaN(price) || price < 0) next.price = t('form.validation.price');
        if (form.discountPrice) {
          const discount = Number(form.discountPrice);
          if (Number.isNaN(discount) || discount < 0) next.discountPrice = t('form.validation.discountInvalid');
          else if (discount >= price) next.discountPrice = t('form.validation.discountTooHigh');
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
      showToast(t('form.toast.coverUploaded'), 'success');
    } catch {
      showToast(t('form.toast.coverFailed'), 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const uploadIntroVideo = async (file: File) => {
    setUploadingIntro(true);
    try {
      const uploaded = await instructorApi.upload('video', file);
      update('introVideo', uploaded.url);
      showToast(t('form.toast.videoUploaded'), 'success');
    } catch {
      showToast(t('form.toast.videoFailed'), 'error');
    } finally {
      setUploadingIntro(false);
    }
  };

  const buildPayload = () => ({
    titleAr: form.titleAr?.trim() || form.titleEn?.trim(),
    titleEn: form.titleEn?.trim() || null,
    categoryId: Number(form.categoryId),
    level: form.level,
    type: form.type,
    language: form.language,
    shortDescriptionAr: form.shortDescriptionAr || null,
    shortDescriptionEn: form.shortDescriptionEn || null,
    descriptionAr: form.descriptionAr || null,
    descriptionEn: form.descriptionEn || null,
    coverImage: form.coverImage || null,
    introVideo: form.introVideo || null,
    whatYouWillLearn: form.whatYouWillLearn,
    whatYouWillLearnEn: form.whatYouWillLearnEn || null,
    requirements: form.requirements || null,
    requirementsEn: form.requirementsEn || null,
    targetAudience: form.targetAudience || null,
    targetAudienceEn: form.targetAudienceEn || null,
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
      showToast(t('form.validation.reviewFields'), 'error');
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
      showToast(t('form.toast.saved'), 'success');
      if (saveMode === 'builder') {
        navigate(`/instructor/courses/${course.id}/builder`);
      } else if (!isEdit) {
        navigate(`/instructor/courses/${course.id}/edit`);
      }
    } catch {
      showToast(t('form.toast.saveFailed'), 'error');
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
    ? t('form.free')
    : form.discountPrice
      ? formatMoney(form.discountPrice, undefined, lang)
      : formatMoney(form.price, undefined, lang);

  const reviewTitle = localizedCourseTitle({ titleAr: form.titleAr, titleEn: form.titleEn }, lang);
  const reviewShortDesc = localizedCourseShortDescription(
    { shortDescriptionAr: form.shortDescriptionAr, shortDescriptionEn: form.shortDescriptionEn },
    lang,
    '—',
  );
  const reviewLearnItems = localizedCourseList(
    linesToList(form.whatYouWillLearn),
    linesToList(form.whatYouWillLearnEn),
    lang,
  );
  const showBothTitles = form.language === 'ar-en' && form.titleAr?.trim() && form.titleEn?.trim();

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
        <span className="course-form-progress-label">{t('form.progress', { progress })}</span>
      </div>

      <nav className="wizard-steps course-wizard-steps" aria-label={t('form.wizardAria')}>
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
              <h2 className="course-form-section-title">{t('form.sections.basic.title')}</h2>
              <p className="course-form-section-desc">{t('form.sections.basic.desc')}</p>
              <p className="course-form-bilingual-hint">{t('form.fields.bilingualHint')}</p>
              <div className="form-grid">
                <div className={bilingualRowClass}>
                  <Input
                    label={t('form.fields.titleAr')}
                    value={form.titleAr}
                    onChange={(e) => update('titleAr', e.target.value)}
                    placeholder={t('form.fields.titleArPlaceholder')}
                    error={errors.titleAr}
                    dir="rtl"
                  />
                  <Input
                    label={t('form.fields.titleEn')}
                    value={form.titleEn}
                    onChange={(e) => update('titleEn', e.target.value)}
                    placeholder={t('form.fields.titleEnPlaceholder')}
                    error={errors.titleEn}
                    dir="ltr"
                  />
                </div>
                <Select
                  label={t('form.fields.category')}
                  value={form.categoryId}
                  onChange={(e) => update('categoryId', e.target.value)}
                  error={errors.categoryId}
                  options={categoryOptions}
                />
                <Select
                  label={t('form.fields.level')}
                  value={form.level}
                  onChange={(e) => update('level', e.target.value)}
                  options={levelOptions}
                />
                <Select
                  label={t('form.fields.type')}
                  value={form.type}
                  onChange={(e) => update('type', e.target.value)}
                  options={typeOptions}
                />
                <Select
                  label={t('form.fields.language')}
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
                    label={t('form.fields.introVideoUrl')}
                    value={form.introVideo}
                    onChange={(e) => update('introVideo', e.target.value)}
                    placeholder="https://"
                    helper={t('form.fields.introVideoHelper')}
                  />
                  <label className="field">
                    <span>{t('form.fields.introVideoUpload')}</span>
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
                    <small className="field-helper">{t('form.fields.introVideoUploadHelper')}</small>
                    <Button type="button" variant="secondary" loading={uploadingIntro} icon={<Upload size={16} />} onClick={() => introVideoInputRef.current?.click()}>
                      {t('form.fields.introVideoUploadBtn')}
                    </Button>
                  </label>
                </Card>
                <div className={bilingualRowClass}>
                  <Textarea
                    label={t('form.fields.shortDescAr')}
                    value={form.shortDescriptionAr}
                    onChange={(e) => update('shortDescriptionAr', e.target.value)}
                    placeholder={t('form.fields.shortDescArPlaceholder')}
                    error={errors.shortDescriptionAr}
                    rows={3}
                    dir="rtl"
                  />
                  <Textarea
                    label={t('form.fields.shortDescEn')}
                    value={form.shortDescriptionEn}
                    onChange={(e) => update('shortDescriptionEn', e.target.value)}
                    placeholder={t('form.fields.shortDescEnPlaceholder')}
                    error={errors.shortDescriptionEn}
                    rows={3}
                    dir="ltr"
                  />
                </div>
                <div className={bilingualRowClass}>
                  <Textarea
                    label={t('form.fields.fullDescAr')}
                    value={form.descriptionAr}
                    onChange={(e) => update('descriptionAr', e.target.value)}
                    placeholder={t('form.fields.fullDescArPlaceholder')}
                    rows={5}
                    dir="rtl"
                  />
                  <Textarea
                    label={t('form.fields.fullDescEn')}
                    value={form.descriptionEn}
                    onChange={(e) => update('descriptionEn', e.target.value)}
                    placeholder={t('form.fields.fullDescEnPlaceholder')}
                    rows={5}
                    dir="ltr"
                  />
                </div>
              </div>
            </>
          ) : null}

          {step === '2' ? (
            <>
              <h2 className="course-form-section-title">{t('form.sections.details.title')}</h2>
              <p className="course-form-section-desc">{t('form.sections.details.desc')}</p>
              <div className="form-grid form-grid-single">
                <div className={bilingualRowClass}>
                  <Textarea
                    label={t('form.fields.whatYouLearnAr')}
                    value={form.whatYouWillLearn}
                    onChange={(e) => update('whatYouWillLearn', e.target.value)}
                    placeholder={t('form.fields.whatYouLearnArPlaceholder')}
                    error={errors.whatYouWillLearn}
                    rows={6}
                    dir="rtl"
                  />
                  <Textarea
                    label={t('form.fields.whatYouLearnEn')}
                    value={form.whatYouWillLearnEn}
                    onChange={(e) => update('whatYouWillLearnEn', e.target.value)}
                    placeholder={t('form.fields.whatYouLearnEnPlaceholder')}
                    error={errors.whatYouWillLearnEn}
                    rows={6}
                    dir="ltr"
                  />
                </div>
                <div className={bilingualRowClass}>
                  <Textarea
                    label={t('form.fields.requirementsAr')}
                    value={form.requirements}
                    onChange={(e) => update('requirements', e.target.value)}
                    placeholder={t('form.fields.requirementsArPlaceholder')}
                    rows={4}
                    dir="rtl"
                  />
                  <Textarea
                    label={t('form.fields.requirementsEn')}
                    value={form.requirementsEn}
                    onChange={(e) => update('requirementsEn', e.target.value)}
                    placeholder={t('form.fields.requirementsEnPlaceholder')}
                    rows={4}
                    dir="ltr"
                  />
                </div>
                <div className={bilingualRowClass}>
                  <Textarea
                    label={t('form.fields.targetAudienceAr')}
                    value={form.targetAudience}
                    onChange={(e) => update('targetAudience', e.target.value)}
                    placeholder={t('form.fields.targetAudienceArPlaceholder')}
                    rows={4}
                    dir="rtl"
                  />
                  <Textarea
                    label={t('form.fields.targetAudienceEn')}
                    value={form.targetAudienceEn}
                    onChange={(e) => update('targetAudienceEn', e.target.value)}
                    placeholder={t('form.fields.targetAudienceEnPlaceholder')}
                    rows={4}
                    dir="ltr"
                  />
                </div>
              </div>
            </>
          ) : null}

          {step === '3' ? (
            <>
              <h2 className="course-form-section-title">{t('form.sections.pricing.title')}</h2>
              <p className="course-form-section-desc">{t('form.sections.pricing.desc')}</p>
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
                      label={t('form.fields.price', { currency: tc('currency.egp') })}
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.price}
                      onChange={(e) => update('price', e.target.value)}
                      error={errors.price}
                    />
                    <Input
                      label={t('form.fields.discountPrice')}
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.discountPrice}
                      onChange={(e) => update('discountPrice', e.target.value)}
                      error={errors.discountPrice}
                      helper={t('form.fields.discountHelper')}
                    />
                  </>
                ) : null}
              </div>
              {!form.isFree && form.price ? (
                <div className="course-price-preview">
                  <span>{t('form.pricePreview')}</span>
                  {form.discountPrice ? (
                    <>
                      <strong>{formatMoney(form.discountPrice, undefined, lang)}</strong>
                      <del>{formatMoney(form.price, undefined, lang)}</del>
                    </>
                  ) : (
                    <strong>{formatMoney(form.price, undefined, lang)}</strong>
                  )}
                </div>
              ) : null}
            </>
          ) : null}

          {step === '4' ? (
            <>
              <h2 className="course-form-section-title">{t('form.sections.review.title')}</h2>
              <p className="course-form-section-desc">{t('form.sections.review.desc')}</p>
              <div className="course-review-layout">
                <div className="course-review-cover-wrap">
                  {form.coverImage ? (
                    <img src={mediaUrl(form.coverImage)} alt="" className="course-review-cover-img" />
                  ) : (
                    <div className="course-review-cover-empty">
                      <Image size={40} />
                      <span>{t('form.review.noCover')}</span>
                    </div>
                  )}
                </div>
                <div className="course-review-body">
                  <div className="course-review-head">
                    <div className="course-review-title-row">
                      <Badge variant="default">{t('form.review.draftBadge')}</Badge>
                      <h3>{reviewTitle || t('form.review.titleFallback')}</h3>
                    </div>
                    {showBothTitles ? (
                      <p className="course-review-alt-title">
                        {lang.startsWith('en') ? form.titleAr : form.titleEn}
                      </p>
                    ) : null}
                  </div>
                  <p className="course-review-desc">{reviewShortDesc}</p>
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
                    {t('form.review.priceLabel')} <strong>{displayPrice}</strong>
                  </p>
                  {reviewLearnItems.length ? (
                    <div className="course-review-list">
                      <h4>{t('form.review.whatYouLearnTitle')}</h4>
                      <ul>
                        {reviewLearnItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <p className="course-review-hint">
                    {t('form.review.hint')}
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
            icon={prevIcon}
            iconPosition={navIconPosition}
            onClick={goPrev}
          >
            {t('form.navigation.prev')}
          </Button>
          <div className="course-form-actions-group">
            {step !== '4' ? (
              <Button
                type="button"
                size="lg"
                icon={nextIcon}
                iconPosition={navIconPosition}
                onClick={goNext}
              >
                {t('form.navigation.next')}
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
                  {isEdit ? t('form.navigation.saveEdits') : t('form.navigation.saveDraft')}
                </Button>
                <Button type="submit" size="lg" loading={submitting} icon={<Save size={18} />}>
                  {t('form.navigation.saveAndBuilder')}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>

      <ConfirmDialog
        isOpen={confirmSave}
        title={t('form.confirm.title')}
        message={
          saveMode === 'builder'
            ? t('form.confirm.messageBuilder')
            : t('form.confirm.messageStay')
        }
        confirmLabel={t('form.confirm.confirmLabel')}
        variant="primary"
        onConfirm={save}
        onCancel={() => setConfirmSave(false)}
      />
    </div>
  );
}
