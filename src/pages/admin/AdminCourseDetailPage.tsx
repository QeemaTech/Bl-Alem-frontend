import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['courses', 'common']);
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
      showToast(t('admin.courses.toast.loadError'), 'error');
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
      showToast(t('admin.courses.toast.actionError'), 'error');
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
      showToast(t('admin.courses.toast.rejected'), 'success');
      setRejectOpen(false);
      setRejectReason('');
      await load();
    } catch {
      showToast(t('admin.courses.toast.rejectError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!courseId) return;
    setSubmitting(true);
    try {
      await adminApi.deleteCourse(courseId);
      showToast(t('admin.courses.toast.deleted'), 'success');
      navigate('/admin/courses');
    } catch {
      showToast(t('admin.courses.toast.deleteError'), 'error');
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
          title={t('admin.courses.notFound.title')}
          description={t('admin.courses.notFound.description')}
        />
        <Button variant="outline" onClick={() => navigate('/admin/courses')}>
          {t('admin.courses.backToCourses')}
        </Button>
      </div>
    );
  }

  return (
    <div className="page-grid admin-course-detail-page">
      <Link to="/admin/courses" className="support-ticket-back">
        <ArrowRight size={18} aria-hidden="true" />
        {t('admin.courses.backToCourses')}
      </Link>

      <Card className="support-ticket-page-card">
        <CourseDetail
          course={course}
          submitting={submitting}
          onApprove={() => runAction('approve', t('admin.courses.toast.approved'))}
          onPublish={() => runAction('publish', t('admin.courses.toast.published'))}
          onReject={() => setRejectOpen(true)}
          onSuspend={() => setSuspendOpen(true)}
          onDelete={() => setDeleteOpen(true)}
        />
      </Card>

      {course.descriptionAr ? (
        <Card className="admin-course-description-card">
          <h3>{t('admin.courses.detail.description')}</h3>
          <p className="course-review-description">{course.descriptionAr}</p>
        </Card>
      ) : null}

      {course.introVideo ? (
        <Card>
          <h3>{t('admin.courses.detail.introVideo')}</h3>
          <video controls src={mediaUrl(course.introVideo)} className="course-review-video" />
        </Card>
      ) : null}

      {course.whatYouWillLearn?.length ? (
        <Card>
          <h3>{t('admin.courses.detail.whatYouWillLearn')}</h3>
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
          <h3>{t('admin.courses.detail.quizzes', { count: course.quizzes.length })}</h3>
          <div className="admin-course-quizzes">
            {course.quizzes.map((quiz: any) => (
              <div key={quiz.id} className="admin-course-quiz-item">
                <strong>{quiz.titleAr}</strong>
                <span className="muted-count">
                  {t('admin.courses.detail.quizMeta', {
                    questions: quiz.questions?.length || 0,
                    minutes: quiz.durationMinutes,
                  })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Modal
        isOpen={rejectOpen}
        title={t('admin.courses.detail.rejectTitle')}
        onClose={() => { setRejectOpen(false); setRejectReason(''); }}
      >
        <form className="stack-sm" onSubmit={submitReject}>
          <p>{t('admin.courses.detail.rejectPrompt')} <strong>{course.titleAr}</strong></p>
          <Textarea
            label={t('admin.courses.detail.rejectReason')}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
          <Button variant="danger" disabled={submitting}>{t('admin.actions.confirmReject')}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={suspendOpen}
        title={t('admin.courses.detail.suspendTitle')}
        message={t('admin.courses.detail.suspendMessage', { name: course.titleAr })}
        confirmLabel={t('admin.actions.confirmSuspend')}
        onConfirm={() => runAction('suspend', t('admin.courses.toast.suspended'))}
        onCancel={() => setSuspendOpen(false)}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        title={t('admin.courses.detail.deleteTitle')}
        message={t('admin.courses.detail.deleteMessage', { name: course.titleAr })}
        confirmLabel={t('common:actions.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
