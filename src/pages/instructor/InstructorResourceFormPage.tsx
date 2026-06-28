import { FormEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, NavChevronBack, Upload } from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { localizedCourseTitle, localizedLessonTitle } from '../../utils/localizedContent';

type AttachTarget = 'course' | 'lesson';

export default function InstructorResourceFormPage() {
  const { t, i18n } = useTranslation('courses');
  const { id, lessonId: lessonIdParam } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isLtr = i18n.language.startsWith('en');
  const bilingualRowClass = `course-bilingual-row${isLtr ? ' course-bilingual-row--en-first' : ''}`;
  const BackIcon = isLtr ? NavChevronBack : ArrowRight;
  const lang = i18n.language;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [lessons, setLessons] = useState<any[]>([]);
  const [attachTo, setAttachTo] = useState<AttachTarget>(lessonIdParam ? 'lesson' : 'course');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    lessonId: lessonIdParam || '',
    titleAr: '',
    titleEn: '',
    fileUrl: '',
    type: 'file',
  });
  const resourceFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const course = await instructorApi.course(id);
        setCourseTitle(localizedCourseTitle(course, lang));
        const allLessons = course.sections?.flatMap((s: any) => s.lessons || []) || [];
        setLessons(allLessons);
        const defaultLessonId =
          lessonIdParam && allLessons.some((l: any) => String(l.id) === lessonIdParam)
            ? lessonIdParam
            : allLessons[0]?.id
              ? String(allLessons[0].id)
              : '';
        if (defaultLessonId) {
          setForm((current) => ({ ...current, lessonId: defaultLessonId }));
        }
        if (!lessonIdParam && !allLessons.length) {
          setAttachTo('course');
        } else if (lessonIdParam && allLessons.some((l: any) => String(l.id) === lessonIdParam)) {
          setAttachTo('lesson');
        }
      } catch {
        showToast(t('resourceForm.loadFailed'), 'error');
        navigate(`/instructor/courses/${id}/builder`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, lessonIdParam, navigate, showToast, t, lang]);

  const builderPath = `/instructor/courses/${id}/builder`;
  const update = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  const changeAttachTo = (value: AttachTarget) => {
    setAttachTo(value);
    if (errors.lessonId) {
      setErrors((current) => {
        const next = { ...current };
        delete next.lessonId;
        return next;
      });
    }
  };

  const uploadResourceFile = async (file: File) => {
    setUploadingResource(true);
    try {
      const uploaded = await instructorApi.upload('file', file);
      update('fileUrl', uploaded.url);
      showToast(t('resourceForm.uploaded'), 'success');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(message || t('resourceForm.uploadFailed'), 'error');
    } finally {
      setUploadingResource(false);
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const hasAr = form.titleAr.trim();
    const hasEn = form.titleEn.trim();

    if (!hasAr && !hasEn) {
      const message = t('resourceForm.validation.titleRequired');
      next.titleAr = message;
      next.titleEn = message;
    }

    if (attachTo === 'lesson') {
      if (!lessons.length) {
        next.lessonId = t('resourceForm.validation.noLessons');
      } else if (!form.lessonId) {
        next.lessonId = t('resourceForm.validation.lesson');
      }
    }

    if (!form.fileUrl.trim()) {
      next.fileUrl = t('resourceForm.validation.fileUrl');
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast(t('resourceForm.validation.reviewFields'), 'error');
      return;
    }
    setSubmitting(true);
    const payload = {
      titleAr: form.titleAr.trim() || form.titleEn.trim(),
      titleEn: form.titleEn.trim() || null,
      fileUrl: form.fileUrl.trim(),
      type: form.type,
    };
    try {
      if (attachTo === 'course') {
        await instructorApi.createCourseResource(id!, payload);
      } else {
        await instructorApi.createResource(form.lessonId, payload);
      }
      showToast(t('resourceForm.created'), 'success');
      navigate(builderPath);
    } catch {
      showToast(t('resourceForm.saveFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton variant="card" />;

  const attachOptions = [
    { label: t('resourceForm.attachCourse'), value: 'course' },
    ...(lessons.length ? [{ label: t('resourceForm.attachLesson'), value: 'lesson' }] : []),
  ];

  return (
    <div className="page-grid course-form-page">
      <Link to={builderPath} className="admin-detail-back">
        <BackIcon size={18} aria-hidden="true" />
        {t('resourceForm.back')}
      </Link>
      <PageHeader
        title={t('resourceForm.createTitle')}
        subtitle={courseTitle}
        breadcrumb={[
          { label: t('management.title'), to: '/instructor/courses' },
          { label: courseTitle, to: builderPath },
          { label: t('resourceForm.newBreadcrumb') },
        ]}
      />
      <Card>
        <p className="course-form-bilingual-hint">{t('resourceForm.bilingualHint')}</p>
        <form className="stack-sm" onSubmit={handleSubmit}>
          <Select
            label={t('resourceForm.attachTo')}
            value={attachTo}
            onChange={(e) => changeAttachTo(e.target.value as AttachTarget)}
            options={attachOptions}
          />
          {attachTo === 'course' ? (
            <p className="field-helper">{t('resourceForm.attachCourseHint')}</p>
          ) : (
            <Select
              label={t('resourceForm.lesson')}
              value={form.lessonId}
              onChange={(e) => update('lessonId', e.target.value)}
              error={errors.lessonId}
              options={lessons.map((l) => ({
                label: localizedLessonTitle(l, lang),
                value: String(l.id),
              }))}
            />
          )}
          <div className={bilingualRowClass}>
            <Input
              label={t('resourceForm.titleAr')}
              value={form.titleAr}
              onChange={(e) => update('titleAr', e.target.value)}
              placeholder={t('resourceForm.titleArPlaceholder')}
              error={errors.titleAr}
              dir="rtl"
            />
            <Input
              label={t('resourceForm.titleEn')}
              value={form.titleEn}
              onChange={(e) => update('titleEn', e.target.value)}
              placeholder={t('resourceForm.titleEnPlaceholder')}
              error={errors.titleEn}
              dir="ltr"
            />
          </div>
          <Input
            label={t('resourceForm.fileUrl')}
            value={form.fileUrl}
            onChange={(e) => update('fileUrl', e.target.value)}
            error={errors.fileUrl}
            required
          />
          <label className="field">
            <span>{t('resourceForm.upload')}</span>
            <input
              ref={resourceFileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.png,.jpg,.jpeg,.webp"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadResourceFile(file);
                e.target.value = '';
              }}
            />
            <small className="field-helper">{t('resourceForm.uploadTypeHint')}</small>
            <Button
              type="button"
              variant="secondary"
              loading={uploadingResource}
              icon={<Upload size={14} />}
              onClick={() => resourceFileInputRef.current?.click()}
            >
              {t('resourceForm.upload')}
            </Button>
          </label>
          <Input label={t('resourceForm.type')} value={form.type} onChange={(e) => update('type', e.target.value)} />
          <div className="course-form-actions">
            <Button type="button" variant="outline" onClick={() => navigate(builderPath)}>
              {t('resourceForm.cancel')}
            </Button>
            <Button type="submit" loading={submitting}>{t('resourceForm.submit')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
