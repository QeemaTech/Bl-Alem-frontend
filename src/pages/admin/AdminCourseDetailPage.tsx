import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from '@/icons';
import { adminApi } from '../../api/admin';
import { CourseCurriculumSummary } from '../../components/admin/courses/CourseCurriculumSummary';
import { CourseDetail } from '../../components/admin/courses/CourseDetail';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { mediaUrl } from '../../utils/mediaUrl';

export default function AdminCourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      setCourse(await adminApi.course(courseId));
    } catch {
      showToast('تعذّر تحميل الكورس.', 'error');
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [courseId]);

  const runAction = async (action: 'approve' | 'publish' | 'suspend', message: string) => {
    if (!courseId) return;
    setSubmitting(true);
    try {
      if (action === 'approve') await adminApi.approveCourse(courseId);
      if (action === 'publish') await adminApi.publishCourse(courseId);
      if (action === 'suspend') await adminApi.suspendCourse(courseId);
      showToast(message, 'success');
      setSuspendOpen(false);
      await load();
    } catch {
      showToast('تعذّر تنفيذ الإجراء.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReject = async (e: FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    setSubmitting(true);
    try {
      await adminApi.rejectCourse(courseId, rejectReason);
      showToast('تم رفض الكورس.', 'success');
      setRejectOpen(false);
      setRejectReason('');
      await load();
    } catch {
      showToast('تعذّر رفض الكورس.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!courseId) return;
    setSubmitting(true);
    try {
      await adminApi.deleteCourse(courseId);
      showToast('تم حذف الكورس.', 'success');
      navigate('/admin/courses');
    } catch {
      showToast('تعذّر حذف الكورس.', 'error');
      setDeleteOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (!course) {
    return (
      <div className="page-grid admin-course-detail-page">
        <EmptyState
          title="الكورس غير موجود"
          description="لم نتمكن من العثور على هذا الكورس."
        />
        <Button variant="outline" onClick={() => navigate('/admin/courses')}>
          العودة للكورسات
        </Button>
      </div>
    );
  }

  return (
    <div className="page-grid admin-course-detail-page">
      <Link to="/admin/courses" className="support-ticket-back">
        <ArrowRight size={18} aria-hidden="true" />
        العودة للكورسات
      </Link>

      <Card className="support-ticket-page-card">
        <CourseDetail
          course={course}
          submitting={submitting}
          onApprove={() => runAction('approve', 'تم اعتماد الكورس.')}
          onPublish={() => runAction('publish', 'تم نشر الكورس.')}
          onReject={() => setRejectOpen(true)}
          onSuspend={() => setSuspendOpen(true)}
          onDelete={() => setDeleteOpen(true)}
        />
      </Card>

      {course.descriptionAr ? (
        <Card className="admin-course-description-card">
          <h3>وصف الكورس</h3>
          <p className="course-review-description">{course.descriptionAr}</p>
        </Card>
      ) : null}

      {course.introVideo ? (
        <Card>
          <h3>فيديو المقدمة</h3>
          <video controls src={mediaUrl(course.introVideo)} className="course-review-video" />
        </Card>
      ) : null}

      {course.whatYouWillLearn?.length ? (
        <Card>
          <h3>ماذا سيتعلم الطالب</h3>
          <ul className="list-style">
            {course.whatYouWillLearn.map((item: string, index: number) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <CourseCurriculumSummary course={course} />

      {course.quizzes?.length ? (
        <Card>
          <h3>الاختبارات ({course.quizzes.length})</h3>
          <div className="admin-course-quizzes">
            {course.quizzes.map((quiz: any) => (
              <div key={quiz.id} className="admin-course-quiz-item">
                <strong>{quiz.titleAr}</strong>
                <span className="muted-count">
                  {quiz.questions?.length || 0} أسئلة · {quiz.durationMinutes} دقيقة
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Modal
        isOpen={rejectOpen}
        title="رفض الكورس"
        onClose={() => { setRejectOpen(false); setRejectReason(''); }}
      >
        <form className="stack-sm" onSubmit={submitReject}>
          <p>رفض كورس: <strong>{course.titleAr}</strong></p>
          <Textarea
            label="سبب الرفض"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
          <Button variant="danger" disabled={submitting}>تأكيد الرفض</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={suspendOpen}
        title="إيقاف الكورس"
        message={`هل أنت متأكد من إيقاف كورس "${course.titleAr}" مؤقتاً؟`}
        confirmLabel="تأكيد الإيقاف"
        onConfirm={() => runAction('suspend', 'تم إيقاف الكورس.')}
        onCancel={() => setSuspendOpen(false)}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        title="حذف الكورس"
        message={`هل أنت متأكد من حذف كورس "${course.titleAr}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
