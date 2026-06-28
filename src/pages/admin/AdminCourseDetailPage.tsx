import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from '@/icons';
import { adminApi } from '../../api/admin';
import { CourseCurriculumSummary } from '../../components/admin/courses/CourseCurriculumSummary';
import { AdminCourseQuizzesSummary } from '../../components/admin/courses/AdminCourseQuizzesSummary';
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
import {
  localizedCourseDescription,
  localizedCourseList,
  localizedCourseTitle,
  localizedResourceTitle,
} from '../../utils/localizedContent';

export default function AdminCourseDetailPage() {
  const { t, i18n } = useTranslation(['courses', 'common']);
  const lang = i18n.language;
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

  const courseTitle = localizedCourseTitle(course, lang);
  const courseDescription = localizedCourseDescription(course, lang);
  const learningPoints = localizedCourseList(course.whatYouWillLearn, course.whatYouWillLearnEn, lang);

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

      {courseDescription ? (
        <Card className="admin-course-description-card">
          <h3>{t('admin.courses.detail.description')}</h3>
          <p className="course-review-description">{courseDescription}</p>
        </Card>
      ) : null}

      {course.introVideo ? (
        <Card>
          <h3>{t('admin.courses.detail.introVideo')}</h3>
          <video controls src={mediaUrl(course.introVideo)} className="course-review-video" />
        </Card>
      ) : null}

      {learningPoints.length ? (
        <Card>
          <h3>{t('admin.courses.detail.whatYouWillLearn')}</h3>
          <ul className="list-style">
            {learningPoints.map((item: string, index: number) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <CourseCurriculumSummary key={course.id} course={course} />

      {course.courseResources?.length ? (
        <Card className="admin-course-resources-card">
          <h3>{t('admin.courses.detail.courseResources', { count: course.courseResources.length })}</h3>
          <ul className="admin-course-resources-list">
            {course.courseResources.map((resource: any) => (
              <li key={resource.id}>
                <a href={mediaUrl(resource.fileUrl)} target="_blank" rel="noreferrer" className="admin-course-lesson-link">
                  {localizedResourceTitle(resource, lang)}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <AdminCourseQuizzesSummary key={course.id} quizzes={course.quizzes || []} />

      <Modal
        isOpen={rejectOpen}
        title={t('admin.courses.detail.rejectTitle')}
        onClose={() => { setRejectOpen(false); setRejectReason(''); }}
      >
        <form className="stack-sm" onSubmit={submitReject}>
          <p>{t('admin.courses.detail.rejectPrompt')} <strong>{courseTitle}</strong></p>
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
        message={t('admin.courses.detail.suspendMessage', { name: courseTitle })}
        confirmLabel={t('admin.actions.confirmSuspend')}
        onConfirm={() => runAction('suspend', t('admin.courses.toast.suspended'))}
        onCancel={() => setSuspendOpen(false)}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        title={t('admin.courses.detail.deleteTitle')}
        message={t('admin.courses.detail.deleteMessage', { name: courseTitle })}
        confirmLabel={t('common:actions.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
