import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, NavChevronBack } from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { localizedCourseTitle } from '../../utils/localizedContent';

const requiresArabic = (language: string) => language === 'ar' || language === 'ar-en';
const requiresEnglish = (language: string) => language === 'en' || language === 'ar-en';

export default function InstructorSectionFormPage() {
  const { t, i18n } = useTranslation('courses');
  const { id, sectionId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = Boolean(sectionId);
  const isLtr = i18n.language.startsWith('en');
  const bilingualRowClass = `course-bilingual-row${isLtr ? ' course-bilingual-row--en-first' : ''}`;
  const BackIcon = isLtr ? NavChevronBack : ArrowRight;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [courseLanguage, setCourseLanguage] = useState('ar');
  const [courseTitle, setCourseTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const course = await instructorApi.course(id);
        setCourseTitle(localizedCourseTitle(course, i18n.language));
        setCourseLanguage(course.language || 'ar');
        if (isEdit && sectionId) {
          const section = course.sections?.find((s: any) => String(s.id) === sectionId);
          setTitleAr(section?.titleAr || '');
          setTitleEn(section?.titleEn || '');
        }
      } catch {
        showToast(t('sectionForm.loadFailed'), 'error');
        navigate(`/instructor/courses/${id}/builder`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, sectionId, isEdit, navigate, showToast, t, i18n.language]);

  const builderPath = `/instructor/courses/${id}/builder`;

  const validate = () => {
    const next: Record<string, string> = {};
    if (requiresArabic(courseLanguage) && !titleAr.trim()) {
      next.titleAr = t('sectionForm.validation.titleAr');
    }
    if (requiresEnglish(courseLanguage) && !titleEn.trim()) {
      next.titleEn = t('sectionForm.validation.titleEn');
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
        titleAr: titleAr.trim() || titleEn.trim(),
        titleEn: titleEn.trim() || null,
      };
      if (isEdit && sectionId) {
        await instructorApi.updateSection(sectionId, payload);
        showToast(t('sectionForm.updated'), 'success');
      } else {
        await instructorApi.createSection(id, payload);
        showToast(t('sectionForm.created'), 'success');
      }
      navigate(builderPath);
    } catch {
      showToast(t('sectionForm.saveFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton variant="card" />;

  return (
    <div className="page-grid course-form-page">
      <Link to={builderPath} className="admin-detail-back">
        <BackIcon size={18} aria-hidden="true" />
        {t('sectionForm.back')}
      </Link>
      <PageHeader
        title={isEdit ? t('sectionForm.editTitle') : t('sectionForm.createTitle')}
        subtitle={courseTitle}
        breadcrumb={[
          { label: t('management.title'), to: '/instructor/courses' },
          { label: courseTitle, to: builderPath },
          { label: isEdit ? t('sectionForm.editBreadcrumb') : t('sectionForm.newBreadcrumb') },
        ]}
      />
      <Card>
        <p className="course-form-bilingual-hint">{t('sectionForm.bilingualHint')}</p>
        <form className="stack-sm" onSubmit={handleSubmit}>
          <div className={bilingualRowClass}>
            <Input
              label={t('sectionForm.titleAr')}
              value={titleAr}
              onChange={(e) => {
                setTitleAr(e.target.value);
                if (errors.titleAr) setErrors((c) => ({ ...c, titleAr: '' }));
              }}
              placeholder={t('sectionForm.titleArPlaceholder')}
              error={errors.titleAr}
              dir="rtl"
              autoFocus={!isLtr}
            />
            <Input
              label={t('sectionForm.titleEn')}
              value={titleEn}
              onChange={(e) => {
                setTitleEn(e.target.value);
                if (errors.titleEn) setErrors((c) => ({ ...c, titleEn: '' }));
              }}
              placeholder={t('sectionForm.titleEnPlaceholder')}
              error={errors.titleEn}
              dir="ltr"
              autoFocus={isLtr}
            />
          </div>
          <div className="course-form-actions">
            <Button type="button" variant="outline" onClick={() => navigate(builderPath)}>
              {t('sectionForm.cancel')}
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? t('sectionForm.save') : t('sectionForm.create')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
