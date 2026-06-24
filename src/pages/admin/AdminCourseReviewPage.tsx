import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, Clock, Layers, Star, Users } from '@/icons';
import { adminApi } from '../../api/admin';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { mediaUrl } from '../../utils/mediaUrl';

const statusLabels: Record<string, string> = {
  DRAFT: 'مسودة',
  PENDING_REVIEW: 'قيد المراجعة',
  APPROVED: 'معتمد',
  PUBLISHED: 'منشور',
  REJECTED: 'مرفوض',
  SUSPENDED: 'موقوف',
};

const levelLabels: Record<string, string> = {
  BEGINNER: 'مبتدئ',
  INTERMEDIATE: 'متوسط',
  ADVANCED: 'متقدم',
};

const typeLabels: Record<string, string> = {
  RECORDED: 'مسجل',
  LIVE: 'مباشر',
  MIXED: 'مختلط',
};

const statusVariant = (status: string) => {
  if (status === 'PUBLISHED') return 'published' as const;
  if (status === 'PENDING_REVIEW') return 'pending' as const;
  if (status === 'APPROVED') return 'success' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  if (status === 'SUSPENDED') return 'suspended' as const;
  if (status === 'DRAFT') return 'info' as const;
  return 'default' as const;
};

const fmtMoney = (course: any) => {
  const price = Number(course?.discountPrice ?? course?.price ?? 0);
  if (!price) return 'مجاني';
  return `${price.toLocaleString('ar-SA')} ر.س`;
};

const fmtDate = (value?: string | null) => (value
  ? new Date(value).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  : '—');

const fmtDuration = (seconds: number) => {
  const mins = Math.round(Number(seconds || 0) / 60);
  return mins ? `${mins} دقيقة` : '—';
};

export default function AdminCourseReviewPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reason, setReason] = useState('');

  const load = () => {
    if (!id) return;
    setLoading(true);
    adminApi.courseContent(id).then(setCourse).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const stats = useMemo(() => {
    if (!course) return null;
    const lessons = course.sections?.reduce(
      (sum: number, s: any) => sum + (s.lessons?.length || 0),
      0,
    ) ?? 0;
    return {
      sections: course.sections?.length || 0,
      lessons,
      quizzes: course.quizzes?.length || 0,
      students: course.totalStudents ?? course._count?.enrollments ?? 0,
      reviews: course._count?.reviews ?? course.reviews?.length ?? 0,
      rating: Number(course.ratingAverage || 0).toFixed(1),
    };
  }, [course]);

  const act = async (type: 'approve' | 'publish' | 'suspend') => {
    if (!id) return;
    if (type === 'approve') await adminApi.approveCourse(id);
    if (type === 'publish') await adminApi.publishCourse(id);
    if (type === 'suspend') await adminApi.suspendCourse(id);
    showToast('تم تنفيذ الإجراء.', 'success');
    setSuspendOpen(false);
    load();
  };

  const reject = async (e: FormEvent) => {
    e.preventDefault();
    await adminApi.rejectCourse(id!, reason);
    showToast('تم رفض الكورس.', 'success');
    setRejectOpen(false);
    setReason('');
    load();
  };

  if (loading) return <DashboardSkeleton />;
  if (!course) {
    return (
      <div className="page-grid">
        <PageHeader
          title="مراجعة الكورس"
          breadcrumb={[{ label: 'الكورسات', to: '/admin/courses' }, { label: 'غير موجود' }]}
        />
      </div>
    );
  }

  const canApprove = course.status === 'PENDING_REVIEW';
  const canPublish = ['APPROVED', 'SUSPENDED'].includes(course.status);
  const canReject = ['PENDING_REVIEW', 'APPROVED'].includes(course.status);
  const canSuspend = ['PUBLISHED', 'APPROVED'].includes(course.status);

  return (
    <div className="page-grid">
      <PageHeader
        title={course.titleAr}
        subtitle={`المحاضر: ${course.instructor?.fullName || '—'} · ${course.category?.nameAr || '—'}`}
        breadcrumb={[
          { label: 'الكورسات', to: '/admin/courses' },
          { label: course.titleAr },
        ]}
        action={
          <div className="chip-row">
            {canApprove ? (
              <Button size="sm" onClick={() => act('approve')}>اعتماد</Button>
            ) : null}
            {canPublish ? (
              <Button size="sm" variant="secondary" onClick={() => act('publish')}>نشر</Button>
            ) : null}
            {canReject ? (
              <Button size="sm" variant="danger" onClick={() => setRejectOpen(true)}>رفض</Button>
            ) : null}
            {canSuspend ? (
              <Button size="sm" variant="secondary" onClick={() => setSuspendOpen(true)}>إيقاف</Button>
            ) : null}
          </div>
        }
      />

      {stats ? (
        <div className="stats-grid">
          <StatCard title="الأقسام" value={String(stats.sections)} icon={Layers} />
          <StatCard title="الدروس" value={String(stats.lessons)} icon={BookOpen} />
          <StatCard title="الاختبارات" value={String(stats.quizzes)} icon={BookOpen} />
          <StatCard title="الطلاب" value={String(stats.students)} icon={Users} />
          <StatCard title="التقييمات" value={String(stats.reviews)} icon={Star} />
          <StatCard title="متوسط التقييم" value={stats.rating} icon={Star} />
        </div>
      ) : null}

      <Card>
        <div className="course-review-hero">
          {course.coverImage ? (
            <img src={mediaUrl(course.coverImage)} alt={course.titleAr} className="course-review-cover" />
          ) : (
            <div className="course-review-cover placeholder">بدون صورة</div>
          )}
          <div className="course-review-meta stack-sm">
            <div className="chip-row">
              <Badge variant={statusVariant(course.status)}>
                {statusLabels[course.status] || course.status}
              </Badge>
              <Badge variant="info">{levelLabels[course.level] || course.level}</Badge>
              <Badge variant="default">{typeLabels[course.type] || course.type}</Badge>
            </div>
            <p>{course.shortDescriptionAr || course.descriptionAr || 'لا يوجد وصف.'}</p>
            <div className="withdrawal-detail">
              <div className="detail-row"><span>السعر</span><strong>{fmtMoney(course)}</strong></div>
              <div className="detail-row"><span>اللغة</span><strong>{course.language === 'ar' ? 'العربية' : course.language}</strong></div>
              <div className="detail-row"><span>تاريخ الإنشاء</span><strong>{fmtDate(course.createdAt)}</strong></div>
              <div className="detail-row"><span>آخر تحديث</span><strong>{fmtDate(course.updatedAt)}</strong></div>
              {course.rejectionReason ? (
                <div className="detail-row"><span>سبب الرفض/الإيقاف</span><strong>{course.rejectionReason}</strong></div>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      {course.descriptionAr ? (
        <Card>
          <h3>وصف الكورس</h3>
          <p className="course-review-description">{course.descriptionAr}</p>
        </Card>
      ) : null}

      <Card>
        <h3>فيديو المقدمة</h3>
        {course.introVideo ? (
          <video controls src={mediaUrl(course.introVideo)} className="course-review-video" />
        ) : (
          <p>لا يوجد فيديو مقدمة.</p>
        )}
      </Card>

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

      {course.sections?.map((section: any) => (
        <Card key={section.id}>
          <h3>{section.titleAr}</h3>
          {section.lessons?.length ? (
            section.lessons.map((lesson: any) => (
              <div key={lesson.id} className="session-card">
                <div className="session-card-info">
                  <div className="chip-row">
                    <h4>{lesson.titleAr}</h4>
                    {lesson.isPreview ? <Badge variant="info">معاينة</Badge> : null}
                    {lesson.isLocked ? <Badge variant="warning">مقفل</Badge> : null}
                  </div>
                  <p>
                    <Clock size={14} /> {fmtDuration(lesson.duration)}
                    {' · '}
                    {lesson.resources?.length || 0} موارد
                    {lesson.videoUrl ? ' · فيديو متاح' : ''}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p>لا توجد دروس في هذا القسم.</p>
          )}
        </Card>
      ))}

      <Card>
        <h3>الاختبارات</h3>
        {course.quizzes?.length ? (
          course.quizzes.map((q: any) => (
            <Card key={q.id} className="stack-sm">
              <div className="section-heading">
                <h4>{q.titleAr}</h4>
                <Badge variant={q.status === 'ACTIVE' ? 'success' : 'warning'}>{q.status}</Badge>
              </div>
              <div className="withdrawal-detail">
                <div className="detail-row"><span>المدة</span><strong>{q.durationMinutes} دقيقة</strong></div>
                <div className="detail-row"><span>درجة النجاح</span><strong>{q.passingScore}%</strong></div>
                <div className="detail-row"><span>مرتبط بدرس</span><strong>{q.lesson?.titleAr || 'اختبار للدورة'}</strong></div>
              </div>
              {q.questions?.length ? (
                <div className="stack-sm">
                  {q.questions.map((question: any) => (
                    <div key={question.id} className="lesson-resource-item">
                      <div>
                        <strong>{question.textAr}</strong>
                        <div className="muted-count">{question.type}</div>
                      </div>
                      <div>
                        {question.answers?.map((answer: any) => (
                          <div key={answer.id}>
                            {answer.isCorrect ? '✓' : '○'} {answer.textAr}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>لا توجد أسئلة.</p>
              )}
            </Card>
          ))
        ) : (
          <p>لا توجد اختبارات.</p>
        )}
      </Card>

      {course.reviews?.length ? (
        <Card>
          <h3>آخر التقييمات</h3>
          {course.reviews.slice(0, 5).map((review: any) => (
            <div key={review.id} className="notification-card">
              <span>{review.user?.fullName || 'طالب'}</span>
              <span>{'★'.repeat(review.rating)}{review.comment ? ` — ${review.comment}` : ''}</span>
            </div>
          ))}
        </Card>
      ) : null}

      <Modal isOpen={rejectOpen} title="رفض الكورس" onClose={() => setRejectOpen(false)}>
        <form className="stack-sm" onSubmit={reject}>
          <Textarea label="سبب الرفض" value={reason} onChange={(e) => setReason(e.target.value)} required />
          <Button variant="danger">تأكيد الرفض</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={suspendOpen}
        title="إيقاف الكورس"
        message={`هل أنت متأكد من إيقاف كورس "${course.titleAr}" مؤقتاً؟`}
        confirmLabel="تأكيد الإيقاف"
        onConfirm={() => act('suspend')}
        onCancel={() => setSuspendOpen(false)}
      />
    </div>
  );
}
