import { FormEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, NavChevronBack, Upload } from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { localizedCourseTitle, localizedSectionTitle } from '../../utils/localizedContent';

const requiresArabic = (language: string) => language === 'ar' || language === 'ar-en';
const requiresEnglish = (language: string) => language === 'en' || language === 'ar-en';

export default function InstructorLessonFormPage() {
  const { t, i18n } = useTranslation('courses');
  const { id, lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = Boolean(lessonId);
  const isLtr = i18n.language.startsWith('en');
  const bilingualRowClass = `course-bilingual-row${isLtr ? ' course-bilingual-row--en-first' : ''}`;
  const BackIcon = isLtr ? NavChevronBack : ArrowRight;
  const lang = i18n.language;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [courseLanguage, setCourseLanguage] = useState('ar');
  const [courseTitle, setCourseTitle] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    sectionId: searchParams.get('sectionId') || '',
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    videoUrl: '',
    durationMinutes: '',
    isPreview: false,
  });
  const lessonVideoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const course = await instructorApi.course(id);
        setCourseTitle(localizedCourseTitle(course, lang));
        setCourseLanguage(course.language || 'ar');
        const courseSections = course.sections || [];
        setSections(courseSections);
        if (isEdit && lessonId) {
          const lesson = course.sections
            ?.flatMap((s: any) => s.lessons || [])
            .find((l: any) => String(l.id) === lessonId);
          if (!lesson) throw new Error('missing');
          setForm({
            sectionId: String(lesson.sectionId),
            titleAr: lesson.titleAr || '',
            titleEn: lesson.titleEn || '',
            descriptionAr: lesson.descriptionAr || '',
            descriptionEn: lesson.descriptionEn || '',
            videoUrl: lesson.videoUrl || '',
            durationMinutes: lesson.duration ? String(Math.round(lesson.duration / 60)) : '',
            isPreview: Boolean(lesson.isPreview),
          });
        } else {
          const fromQuery = searchParams.get('sectionId');
          const defaultSectionId = fromQuery || (courseSections[0]?.id ? String(courseSections[0].id) : '');
          if (defaultSectionId) {
            setForm((current) => ({ ...current, sectionId: defaultSectionId }));
          }
        }
      } catch {
        showToast(t('lessonForm.loadFailed'), 'error');
        navigate(`/instructor/courses/${id}/builder`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, lessonId, isEdit, navigate, showToast, searchParams, t, lang]);

  const builderPath = `/instructor/courses/${id}/builder`;
  const update = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));

  const uploadLessonVideo = async (file: File) => {
    setUploadingVideo(true);
    try {
      const uploaded = await instructorApi.upload('video', file);
      update('videoUrl', uploaded.url);
      showToast(t('lessonForm.videoUploaded'), 'success');
    } catch {
      showToast(t('lessonForm.videoFailed'), 'error');
    } finally {
      setUploadingVideo(false);
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (requiresArabic(courseLanguage) && !form.titleAr.trim()) {
      next.titleAr = t('lessonForm.validation.titleAr');
    }
    if (requiresEnglish(courseLanguage) && !form.titleEn.trim()) {
      next.titleEn = t('lessonForm.validation.titleEn');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        sectionId: Number(form.sectionId),
        titleAr: form.titleAr.trim() || form.titleEn.trim(),
        titleEn: form.titleEn.trim() || null,
        descriptionAr: form.descriptionAr.trim() || null,
        descriptionEn: form.descriptionEn.trim() || null,
        videoUrl: form.videoUrl.trim(),
        duration: Math.round(Number(form.durationMinutes || 0) * 60),
        isPreview: form.isPreview,
        isLocked: !form.isPreview,
      };
      if (isEdit && lessonId) {
        await instructorApi.updateLesson(lessonId, payload);
        showToast(t('lessonForm.updated'), 'success');
      } else {
        await instructorApi.createLesson(id, payload);
        showToast(t('lessonForm.created'), 'success');
      }
      navigate(builderPath);
    } catch {
      showToast(t('lessonForm.saveFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton variant="card" />;

  if (!sections.length) {
    return (
      <div className="page-grid course-form-page">
        <Link to={builderPath} className="admin-detail-back">
          <BackIcon size={18} aria-hidden="true" />
          {t('lessonForm.back')}
        </Link>
        <Card>
          <EmptyState title={t('lessonForm.noSectionsTitle')} description={t('lessonForm.noSectionsDesc')} />
          <Button onClick={() => navigate(`/instructor/courses/${id}/sections/new`)}>
            {t('lessonForm.addSession')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-grid course-form-page">
      <Link to={builderPath} className="admin-detail-back">
        <BackIcon size={18} aria-hidden="true" />
        {t('lessonForm.back')}
      </Link>
      <PageHeader
        title={isEdit ? t('lessonForm.editTitle') : t('lessonForm.createTitle')}
        subtitle={courseTitle}
        breadcrumb={[
          { label: t('management.title'), to: '/instructor/courses' },
          { label: courseTitle, to: builderPath },
          { label: isEdit ? t('lessonForm.editBreadcrumb') : t('lessonForm.newBreadcrumb') },
        ]}
      />
      <Card>
        <p className="course-form-bilingual-hint">{t('lessonForm.bilingualHint')}</p>
        <form className="stack-sm" onSubmit={handleSubmit}>
          <Select
            label={t('lessonForm.section')}
            value={form.sectionId}
            onChange={(e) => update('sectionId', e.target.value)}
            options={sections.map((s) => ({
              label: localizedSectionTitle(s, lang),
              value: String(s.id),
            }))}
          />
          <div className={bilingualRowClass}>
            <Input
              label={t('lessonForm.titleAr')}
              value={form.titleAr}
              onChange={(e) => update('titleAr', e.target.value)}
              placeholder={t('lessonForm.titleArPlaceholder')}
              error={errors.titleAr}
              dir="rtl"
            />
            <Input
              label={t('lessonForm.titleEn')}
              value={form.titleEn}
              onChange={(e) => update('titleEn', e.target.value)}
              placeholder={t('lessonForm.titleEnPlaceholder')}
              error={errors.titleEn}
              dir="ltr"
            />
          </div>
          <div className={bilingualRowClass}>
            <Textarea
              label={t('lessonForm.descriptionAr')}
              value={form.descriptionAr}
              onChange={(e) => update('descriptionAr', e.target.value)}
              placeholder={t('lessonForm.descriptionArPlaceholder')}
              dir="rtl"
            />
            <Textarea
              label={t('lessonForm.descriptionEn')}
              value={form.descriptionEn}
              onChange={(e) => update('descriptionEn', e.target.value)}
              placeholder={t('lessonForm.descriptionEnPlaceholder')}
              dir="ltr"
            />
          </div>
          <Input
            label={t('lessonForm.videoUrl')}
            value={form.videoUrl}
            onChange={(e) => update('videoUrl', e.target.value)}
          />
          <label className="field">
            <span>{t('lessonForm.uploadVideo')}</span>
            <input
              ref={lessonVideoInputRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLessonVideo(file);
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              variant="secondary"
              loading={uploadingVideo}
              icon={<Upload size={14} />}
              onClick={() => lessonVideoInputRef.current?.click()}
            >
              {t('lessonForm.uploadVideo')}
            </Button>
          </label>
          <Input
            label={t('lessonForm.duration')}
            type="number"
            min={0}
            value={form.durationMinutes}
            onChange={(e) => update('durationMinutes', e.target.value)}
            helper={t('lessonForm.durationHelper')}
          />
          <label className="checkbox-field modal-toggle-field">
            <input
              type="checkbox"
              checked={form.isPreview}
              onChange={(e) => update('isPreview', e.target.checked)}
            />
            <span>
              <strong>{t('lessonForm.previewLabel')}</strong>
              <small>{t('lessonForm.previewHelper')}</small>
            </span>
          </label>
          <div className="course-form-actions">
            <Button type="button" variant="outline" onClick={() => navigate(builderPath)}>
              {t('lessonForm.cancel')}
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? t('lessonForm.save') : t('lessonForm.create')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
