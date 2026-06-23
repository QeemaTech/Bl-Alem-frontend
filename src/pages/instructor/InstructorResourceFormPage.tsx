import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Upload } from 'lucide-react';
import { instructorApi } from '../../api/instructor';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';

export default function InstructorResourceFormPage() {
  const { id, lessonId: lessonIdParam } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [lessons, setLessons] = useState<any[]>([]);
  const [form, setForm] = useState({
    lessonId: lessonIdParam || '',
    title: '',
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
        setCourseTitle(course.titleAr || '');
        const allLessons = course.sections?.flatMap((s: any) => s.lessons || []) || [];
        setLessons(allLessons);
        if (lessonIdParam && allLessons.some((l: any) => String(l.id) === lessonIdParam)) {
          setForm((current) => ({ ...current, lessonId: lessonIdParam }));
        }
      } catch {
        showToast('تعذّر تحميل بيانات الكورس.', 'error');
        navigate(`/instructor/courses/${id}/builder`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, lessonIdParam, navigate, showToast]);

  const builderPath = `/instructor/courses/${id}/builder`;
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const uploadResourceFile = async (file: File) => {
    setUploadingResource(true);
    try {
      const uploaded = await instructorApi.upload('file', file);
      update('fileUrl', uploaded.url);
      showToast('تم رفع الملف.', 'success');
    } catch {
      showToast('تعذّر رفع الملف.', 'error');
    } finally {
      setUploadingResource(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.lessonId) return;
    setSubmitting(true);
    try {
      await instructorApi.createResource(form.lessonId, {
        title: form.title.trim(),
        fileUrl: form.fileUrl.trim(),
        type: form.type,
      });
      showToast('تم إضافة المورد.', 'success');
      navigate(builderPath);
    } catch {
      showToast('تعذّر إضافة المورد.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton variant="card" />;

  if (!lessons.length) {
    return (
      <div className="page-grid course-form-page">
        <Link to={builderPath} className="admin-detail-back">
          <ArrowRight size={18} aria-hidden="true" />
          العودة لمنشئ الكورس
        </Link>
        <Card>
          <EmptyState title="لا توجد دروس" description="أضف درساً أولاً ثم أرفق المورد عليه." />
          <Button onClick={() => navigate(`/instructor/courses/${id}/lessons/new`)}>
            إضافة درس
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-grid course-form-page">
      <Link to={builderPath} className="admin-detail-back">
        <ArrowRight size={18} aria-hidden="true" />
        العودة لمنشئ الكورس
      </Link>
      <PageHeader
        title="إضافة مورد"
        subtitle={courseTitle}
        breadcrumb={[
          { label: 'كورساتي', to: '/instructor/courses' },
          { label: courseTitle, to: builderPath },
          { label: 'مورد جديد' },
        ]}
      />
      <Card>
        <form className="stack-sm" onSubmit={handleSubmit}>
          <Select
            label="الدرس"
            value={form.lessonId}
            onChange={(e) => update('lessonId', e.target.value)}
            options={lessons.map((l) => ({ label: l.titleAr, value: String(l.id) }))}
          />
          <Input
            label="عنوان المورد"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            required
          />
          <Input
            label="رابط الملف"
            value={form.fileUrl}
            onChange={(e) => update('fileUrl', e.target.value)}
            required
          />
          <label className="field">
            <span>رفع الملف</span>
            <input
              ref={resourceFileInputRef}
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadResourceFile(file);
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              variant="secondary"
              loading={uploadingResource}
              icon={<Upload size={14} />}
              onClick={() => resourceFileInputRef.current?.click()}
            >
              رفع الملف
            </Button>
          </label>
          <Input label="النوع" value={form.type} onChange={(e) => update('type', e.target.value)} />
          <div className="course-form-actions">
            <Button type="button" variant="outline" onClick={() => navigate(builderPath)}>
              إلغاء
            </Button>
            <Button loading={submitting}>إضافة المورد</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
