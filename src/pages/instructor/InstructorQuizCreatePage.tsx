import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { instructorApi } from '../../api/instructor';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';

export default function InstructorQuizCreatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [lessons, setLessons] = useState<any[]>([]);
  const [form, setForm] = useState({
    titleAr: '',
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
        setCourseTitle(course.titleAr || '');
        setLessons(course.sections?.flatMap((s: any) => s.lessons || []) || []);
      } catch {
        showToast('تعذّر تحميل بيانات الكورس.', 'error');
        navigate(`/instructor/courses/${id}/builder`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate, showToast]);

  const builderPath = `/instructor/courses/${id}/builder`;
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      const quiz = await instructorApi.createQuiz(id, {
        titleAr: form.titleAr.trim(),
        lessonId: form.lessonId || null,
        durationMinutes: Number(form.durationMinutes || 10),
        passingScore: Number(form.passingScore || 60),
      });
      showToast('تم إنشاء الاختبار. أضف الأسئلة الآن.', 'success');
      navigate(`/instructor/quizzes/${quiz.id}`);
    } catch {
      showToast('تعذّر إنشاء الاختبار.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton variant="card" />;

  return (
    <div className="page-grid course-form-page quiz-builder-page">
      <Link to={builderPath} className="admin-detail-back">
        <ArrowRight size={18} aria-hidden="true" />
        العودة لمنشئ الكورس
      </Link>
      <PageHeader
        title="إضافة اختبار"
        subtitle="بعد الحفظ ستنتقل مباشرة لإضافة الأسئلة"
        breadcrumb={[
          { label: 'كورساتي', to: '/instructor/courses' },
          { label: courseTitle, to: builderPath },
          { label: 'اختبار جديد' },
        ]}
      />
      <Card className="quiz-settings-card">
        <form className="stack-sm" onSubmit={handleSubmit}>
          <Input
            label="عنوان الاختبار"
            value={form.titleAr}
            onChange={(e) => update('titleAr', e.target.value)}
            required
            autoFocus
          />
          <Select
            label="مرتبط بدرس"
            value={form.lessonId}
            onChange={(e) => update('lessonId', e.target.value)}
            options={[
              { label: 'اختبار للدورة بالكامل', value: '' },
              ...lessons.map((l) => ({ label: l.titleAr, value: String(l.id) })),
            ]}
          />
          <Input
            label="المدة (بالدقائق)"
            type="number"
            min={1}
            value={form.durationMinutes}
            onChange={(e) => update('durationMinutes', e.target.value)}
          />
          <Input
            label="درجة النجاح %"
            type="number"
            min={1}
            max={100}
            value={form.passingScore}
            onChange={(e) => update('passingScore', e.target.value)}
          />
          <div className="course-form-actions">
            <Button type="button" variant="outline" onClick={() => navigate(builderPath)}>
              إلغاء
            </Button>
            <Button loading={submitting}>إنشاء والانتقال للأسئلة</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
