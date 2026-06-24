import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';

export default function InstructorSectionFormPage() {
  const { id, sectionId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = Boolean(sectionId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const course = await instructorApi.course(id);
        setCourseTitle(course.titleAr || '');
        if (isEdit && sectionId) {
          const section = course.sections?.find((s: any) => String(s.id) === sectionId);
          setTitleAr(section?.titleAr || '');
        }
      } catch {
        showToast('تعذّر تحميل بيانات الكورس.', 'error');
        navigate(`/instructor/courses/${id}/builder`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, sectionId, isEdit, navigate, showToast]);

  const builderPath = `/instructor/courses/${id}/builder`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      if (isEdit && sectionId) {
        await instructorApi.updateSection(sectionId, { titleAr: titleAr.trim() });
        showToast('تم تحديث القسم.', 'success');
      } else {
        await instructorApi.createSection(id, { titleAr: titleAr.trim() });
        showToast('تم إضافة القسم.', 'success');
      }
      navigate(builderPath);
    } catch {
      showToast('تعذّر حفظ القسم.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton variant="card" />;

  return (
    <div className="page-grid course-form-page">
      <Link to={builderPath} className="admin-detail-back">
        <ArrowRight size={18} aria-hidden="true" />
        العودة لمنشئ الكورس
      </Link>
      <PageHeader
        title={isEdit ? 'تعديل السيشن' : 'إضافة سيشن'}
        subtitle={courseTitle}
        breadcrumb={[
          { label: 'كورساتي', to: '/instructor/courses' },
          { label: courseTitle, to: builderPath },
          { label: isEdit ? 'تعديل سيشن' : 'سيشن جديد' },
        ]}
      />
      <Card>
        <form className="stack-sm" onSubmit={handleSubmit}>
          <Input
            label="عنوان السيشن"
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            required
            autoFocus
          />
          <div className="course-form-actions">
            <Button type="button" variant="outline" onClick={() => navigate(builderPath)}>
              إلغاء
            </Button>
            <Button loading={submitting}>{isEdit ? 'حفظ التعديلات' : 'إضافة السيشن'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
