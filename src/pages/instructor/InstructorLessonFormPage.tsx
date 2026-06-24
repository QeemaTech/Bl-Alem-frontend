import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Upload } from '@/icons';
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

export default function InstructorLessonFormPage() {
  const { id, lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = Boolean(lessonId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [form, setForm] = useState({
    sectionId: searchParams.get('sectionId') || '',
    titleAr: '',
    descriptionAr: '',
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
        setCourseTitle(course.titleAr || '');
        setSections(course.sections || []);
        if (isEdit && lessonId) {
          const lesson = course.sections
            ?.flatMap((s: any) => s.lessons || [])
            .find((l: any) => String(l.id) === lessonId);
          if (!lesson) throw new Error('missing');
          setForm({
            sectionId: String(lesson.sectionId),
            titleAr: lesson.titleAr || '',
            descriptionAr: lesson.descriptionAr || '',
            videoUrl: lesson.videoUrl || '',
            durationMinutes: lesson.duration ? String(Math.round(lesson.duration / 60)) : '',
            isPreview: Boolean(lesson.isPreview),
          });
        }
      } catch {
        showToast('تعذّر تحميل بيانات الدرس.', 'error');
        navigate(`/instructor/courses/${id}/builder`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, lessonId, isEdit, navigate, showToast]);

  const builderPath = `/instructor/courses/${id}/builder`;
  const update = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));

  const uploadLessonVideo = async (file: File) => {
    setUploadingVideo(true);
    try {
      const uploaded = await instructorApi.upload('video', file);
      update('videoUrl', uploaded.url);
      showToast('تم رفع الفيديو.', 'success');
    } catch {
      showToast('تعذّر رفع الفيديو.', 'error');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      const payload = {
        sectionId: Number(form.sectionId),
        titleAr: form.titleAr.trim(),
        descriptionAr: form.descriptionAr.trim(),
        videoUrl: form.videoUrl.trim(),
        duration: Math.round(Number(form.durationMinutes || 0) * 60),
        isPreview: form.isPreview,
        isLocked: !form.isPreview,
      };
      if (isEdit && lessonId) {
        await instructorApi.updateLesson(lessonId, payload);
        showToast('تم تحديث الدرس.', 'success');
      } else {
        await instructorApi.createLesson(id, payload);
        showToast('تم إضافة الدرس.', 'success');
      }
      navigate(builderPath);
    } catch {
      showToast('تعذّر حفظ الدرس.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton variant="card" />;

  if (!sections.length) {
    return (
      <div className="page-grid course-form-page">
        <Link to={builderPath} className="admin-detail-back">
          <ArrowRight size={18} aria-hidden="true" />
          العودة لمنشئ الكورس
        </Link>
        <Card>
          <EmptyState
            title="أضف سيشناً أولاً"
            description="لا يمكن إضافة درس بدون سيشن. أنشئ سيشناً ثم عد لإضافة الدروس."
          />
          <Button onClick={() => navigate(`/instructor/courses/${id}/sections/new`)}>
            إضافة سيشن
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
        title={isEdit ? 'تعديل الدرس' : 'إضافة درس'}
        subtitle={courseTitle}
        breadcrumb={[
          { label: 'كورساتي', to: '/instructor/courses' },
          { label: courseTitle, to: builderPath },
          { label: isEdit ? 'تعديل درس' : 'درس جديد' },
        ]}
      />
      <Card>
        <form className="stack-sm" onSubmit={handleSubmit}>
          <Select
            label="السيشن"
            value={form.sectionId}
            onChange={(e) => update('sectionId', e.target.value)}
            options={sections.map((s) => ({ label: s.titleAr, value: String(s.id) }))}
          />
          <Input
            label="عنوان الدرس"
            value={form.titleAr}
            onChange={(e) => update('titleAr', e.target.value)}
            required
            autoFocus
          />
          <Textarea
            label="الوصف"
            value={form.descriptionAr}
            onChange={(e) => update('descriptionAr', e.target.value)}
          />
          <Input
            label="رابط الفيديو"
            value={form.videoUrl}
            onChange={(e) => update('videoUrl', e.target.value)}
          />
          <label className="field">
            <span>رفع فيديو الدرس</span>
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
              رفع الفيديو
            </Button>
          </label>
          <Input
            label="المدة (بالدقائق)"
            type="number"
            min={0}
            value={form.durationMinutes}
            onChange={(e) => update('durationMinutes', e.target.value)}
            helper="مثال: 15 تعني ربع ساعة"
          />
          <label className="checkbox-field modal-toggle-field">
            <input
              type="checkbox"
              checked={form.isPreview}
              onChange={(e) => update('isPreview', e.target.checked)}
            />
            <span>
              <strong>درس معاينة مجاني</strong>
              <small>يظهر للزوار قبل شراء الكورس ليشاهدوا جزءاً من المحتوى ويقرروا الاشتراك.</small>
            </span>
          </label>
          <div className="course-form-actions">
            <Button type="button" variant="outline" onClick={() => navigate(builderPath)}>
              إلغاء
            </Button>
            <Button loading={submitting}>{isEdit ? 'حفظ التعديلات' : 'إضافة الدرس'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
