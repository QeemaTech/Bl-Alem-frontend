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
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { localizedCourseTitle, localizedLessonTitle } from '../../utils/localizedContent';

const requiresArabic = (language: string) => language === 'ar' || language === 'ar-en';
const requiresEnglish = (language: string) => language === 'en' || language === 'ar-en';

export default function InstructorQuizCreatePage() {
  const { t, i18n } = useTranslation('courses');
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isLtr = i18n.language.startsWith('en');
  const bilingualRowClass = `course-bilingual-row${isLtr ? ' course-bilingual-row--en-first' : ''}`;
  const BackIcon = isLtr ? NavChevronBack : ArrowRight;
  const lang = i18n.language;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [courseLanguage, setCourseLanguage] = useState('ar');
  const [courseTitle, setCourseTitle] = useState('');
  const [lessons, setLessons] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    titleAr: '',
    titleEn: '',
    lessonId: '',
    durationMinutes: '10',
    passingScore: '60',
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const course = await instructorApi.course(id);
        setCourseTitle(localizedCourseTitle(course, lang));
        setCourseLanguage(course.language || 'ar');
        setLessons(course.sections?.flatMap((s: any) => s.lessons || []) || []);
      } catch {
        showToast(t('quizForm.loadFailed'), 'error');
        navigate(`/instructor/courses/${id}/builder`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate, showToast, t, lang]);

  const builderPath = `/instructor/courses/${id}/builder`;
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (requiresArabic(courseLanguage) && !form.titleAr.trim()) {
      next.titleAr = t('quizForm.validation.titleAr');
    }
    if (requiresEnglish(courseLanguage) && !form.titleEn.trim()) {
      next.titleEn = t('quizForm.validation.titleEn');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !validate()) return;
    setSubmitting(true);
    try {
      const quiz = await instructorApi.createQuiz(id, {
        titleAr: form.titleAr.trim() || form.titleEn.trim(),
        titleEn: form.titleEn.trim() || null,
        lessonId: form.lessonId || null,
        durationMinutes: Number(form.durationMinutes || 10),
        passingScore: Number(form.passingScore || 60),
      });
      showToast(t('quizForm.created'), 'success');
      navigate(`/instructor/quizzes/${quiz.id}`);
    } catch {
      showToast(t('quizForm.saveFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton variant="card" />;

  return (
    <div className="page-grid course-form-page quiz-builder-page">
      <Link to={builderPath} className="admin-detail-back">
        <BackIcon size={18} aria-hidden="true" />
        {t('quizForm.back')}
      </Link>
      <PageHeader
        title={t('quizForm.createTitle')}
        subtitle={t('quizForm.subtitle')}
        breadcrumb={[
          { label: t('management.title'), to: '/instructor/courses' },
          { label: courseTitle, to: builderPath },
          { label: t('quizForm.newBreadcrumb') },
        ]}
      />
      <Card className="quiz-settings-card">
        <p className="course-form-bilingual-hint">{t('quizForm.bilingualHint')}</p>
        <form className="stack-sm" onSubmit={handleSubmit}>
          <div className={bilingualRowClass}>
            <Input
              label={t('quizForm.titleAr')}
              value={form.titleAr}
              onChange={(e) => update('titleAr', e.target.value)}
              placeholder={t('quizForm.titleArPlaceholder')}
              error={errors.titleAr}
              dir="rtl"
              autoFocus={!isLtr}
            />
            <Input
              label={t('quizForm.titleEn')}
              value={form.titleEn}
              onChange={(e) => update('titleEn', e.target.value)}
              placeholder={t('quizForm.titleEnPlaceholder')}
              error={errors.titleEn}
              dir="ltr"
              autoFocus={isLtr}
            />
          </div>
          <Select
            label={t('quizForm.linkedLesson')}
            value={form.lessonId}
            onChange={(e) => update('lessonId', e.target.value)}
            options={[
              { label: t('quizForm.fullCourse'), value: '' },
              ...lessons.map((l) => ({
                label: localizedLessonTitle(l, lang),
                value: String(l.id),
              })),
            ]}
          />
          <Input
            label={t('quizForm.duration')}
            type="number"
            min={1}
            value={form.durationMinutes}
            onChange={(e) => update('durationMinutes', e.target.value)}
          />
          <Input
            label={t('quizForm.passingScore')}
            type="number"
            min={1}
            max={100}
            value={form.passingScore}
            onChange={(e) => update('passingScore', e.target.value)}
          />
          <div className="course-form-actions">
            <Button type="button" variant="outline" onClick={() => navigate(builderPath)}>
              {t('quizForm.cancel')}
            </Button>
            <Button type="submit" loading={submitting}>{t('quizForm.submit')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
