import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Layers, Send, Trash2 } from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { CourseGridSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';

const tabs = [
  { id: 'all', label: 'الكل' },
  { id: 'DRAFT', label: 'مسودة' },
  { id: 'PENDING_REVIEW', label: 'قيد المراجعة' },
  { id: 'PUBLISHED', label: 'منشورة' },
  { id: 'REJECTED', label: 'مرفوضة' },
  { id: 'SUSPENDED', label: 'موقوفة' },
];

const courseVariant = (status: string) => {
  if (status === 'PUBLISHED') return 'published' as const;
  if (status === 'PENDING_REVIEW') return 'pending' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  if (status === 'SUSPENDED') return 'suspended' as const;
  return 'default' as const;
};

export default function InstructorCoursesPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('all');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    instructorApi.courses({ status: tab }).then(setCourses).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const submit = async (id: number) => {
    await instructorApi.submitCourseReview(id);
    showToast('تم إرسال الكورس للمراجعة.', 'success');
    await load();
  };

  const remove = async () => {
    if (!deleteId) return;
    await instructorApi.deleteCourse(deleteId);
    showToast('تم حذف الكورس.', 'success');
    setDeleteId(null);
    await load();
  };

  return (
    <div className="page-grid">
      <PageHeader
        title="إدارة الكورسات"
        subtitle="أنشئ وعدّل كورساتك وأرسلها للمراجعة"
        action={
          <Link to="/instructor/courses/create">
            <Button>إضافة كورس</Button>
          </Link>
        }
      />
      <Tabs activeTab={tab} onChange={setTab} tabs={tabs} />
      {loading ? (
        <CourseGridSkeleton />
      ) : courses.length ? (
        <div className="course-list-grid">
          {courses.map((course) => (
            <Card key={course.id} className="discovery-card">
              <div className="course-cover">
                {course.coverImage ? <img src={course.coverImage} alt="" /> : 'كورس'}
              </div>
              <Badge variant={courseVariant(course.status)}>{course.status}</Badge>
              <h3>{course.titleAr}</h3>
              <p>{course.category?.nameAr} | {Number(course.price || 0)} ج.م</p>
              <p>{course._count?.enrollments || 0} طالب | {Number(course.ratingAverage || 0).toFixed(1)} تقييم</p>
              <div className="card-actions">
                <Link to={`/instructor/courses/${course.id}/edit`}>
                  <Button variant="secondary" icon={<Edit size={16} />}>تعديل</Button>
                </Link>
                <Link to={`/instructor/courses/${course.id}/builder`}>
                  <Button variant="secondary" icon={<Layers size={16} />}>المحتوى</Button>
                </Link>
                <Button variant="secondary" onClick={() => submit(course.id)} icon={<Send size={16} />}>
                  للمراجعة
                </Button>
                <Button variant="danger" onClick={() => setDeleteId(course.id)} icon={<Trash2 size={16} />}>
                  حذف
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="لا توجد كورسات"
            description="ابدأ بإنشاء كورس جديد كمسودة."
            actionLabel="إضافة كورس"
            onAction={() => { window.location.href = '/instructor/courses/create'; }}
          />
        </Card>
      )}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="حذف الكورس"
        message="هل أنت متأكد من حذف هذا الكورس؟"
        onConfirm={remove}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
