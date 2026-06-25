import {
  BookOpen,
  CheckCircle2,
  Layers,
  Send,
  Shield,
  Star,
  Trash2,
  Users,
  XCircle,
} from '@/icons';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { mediaUrl } from '../../../utils/mediaUrl';
import {
  canApproveCourse,
  canPublishCourse,
  canRejectCourse,
  canSuspendCourse,
  fmtCourseDate,
  fmtMoney,
  getCourseStats,
  levelLabels,
  statusLabels,
  statusVariant,
  typeLabels,
} from './courseShared';

interface CourseDetailProps {
  course: any;
  onApprove?: () => void;
  onPublish?: () => void;
  onReject?: () => void;
  onSuspend?: () => void;
  onDelete?: () => void;
  submitting?: boolean;
}

export function CourseDetail({
  course,
  onApprove,
  onPublish,
  onReject,
  onSuspend,
  onDelete,
  submitting,
}: CourseDetailProps) {
  const stats = getCourseStats(course);
  const status = String(course.status || '');

  return (
    <div className="support-ticket-detail admin-course-detail">
      <div className="support-ticket-detail-header">
        <div className="admin-course-detail-heading">
          <span className="support-ticket-id">#{course.id}</span>
          <h2>{course.titleAr}</h2>
          {course.titleEn ? <p className="admin-course-subtitle">{course.titleEn}</p> : null}
          <p className="admin-course-instructor">
            المحاضر: <strong>{course.instructor?.fullName || '—'}</strong>
            {course.instructor?.email ? (
              <span dir="ltr" className="admin-course-instructor-email">{course.instructor.email}</span>
            ) : null}
          </p>
        </div>
        <Badge variant={statusVariant(status)} dot className="status-badge">
          {statusLabels[status] || status}
        </Badge>
      </div>

      <div className="course-review-hero admin-course-detail-hero">
        {course.coverImage ? (
          <img src={mediaUrl(course.coverImage)} alt={course.titleAr} className="course-review-cover" />
        ) : (
          <div className="course-review-cover placeholder">بدون صورة</div>
        )}
        <div className="course-review-meta stack-sm">
          <div className="chip-row">
            <Badge variant="info">{levelLabels[course.level] || course.level}</Badge>
            <Badge variant="default">{typeLabels[course.type] || course.type}</Badge>
            {course.category?.nameAr ? (
              <Badge variant="default">{course.category.nameAr}</Badge>
            ) : null}
          </div>
          <p>{course.shortDescriptionAr || 'لا يوجد وصف مختصر.'}</p>
        </div>
      </div>

      <div className="admin-course-stats-row">
        <div className="admin-course-stat">
          <Layers size={18} aria-hidden="true" />
          <span>{stats.sections} أقسام</span>
        </div>
        <div className="admin-course-stat">
          <BookOpen size={18} aria-hidden="true" />
          <span>{stats.lessons} درس</span>
        </div>
        <div className="admin-course-stat">
          <Users size={18} aria-hidden="true" />
          <span>{stats.students} طالب</span>
        </div>
        <div className="admin-course-stat">
          <Star size={18} aria-hidden="true" />
          <span>{stats.rating} ({stats.reviews} تقييم)</span>
        </div>
      </div>

      <div className="admin-course-meta">
        <div className="detail-row">
          <span>التصنيف</span>
          <strong>{course.category?.nameAr || '—'}</strong>
        </div>
        <div className="detail-row">
          <span>المستوى</span>
          <strong>{levelLabels[course.level] || course.level}</strong>
        </div>
        <div className="detail-row">
          <span>السعر</span>
          <strong>{fmtMoney(course)}</strong>
        </div>
        <div className="detail-row">
          <span>اللغة</span>
          <strong>{course.language === 'ar' ? 'العربية' : course.language || '—'}</strong>
        </div>
        <div className="detail-row">
          <span>عدد الدروس</span>
          <strong>{stats.lessons}</strong>
        </div>
        <div className="detail-row">
          <span>عدد الطلاب</span>
          <strong>{stats.students}</strong>
        </div>
        <div className="detail-row">
          <span>تاريخ الإنشاء</span>
          <strong>{fmtCourseDate(course.createdAt, true)}</strong>
        </div>
        <div className="detail-row">
          <span>آخر تحديث</span>
          <strong>{fmtCourseDate(course.updatedAt, true)}</strong>
        </div>
        {course.rejectionReason ? (
          <div className="detail-row">
            <span>سبب الرفض/الإيقاف</span>
            <strong>{course.rejectionReason}</strong>
          </div>
        ) : null}
      </div>

      <div className="admin-course-detail-actions">
        {canApproveCourse(status) && onApprove ? (
          <Button
            variant="secondary"
            size="sm"
            icon={<CheckCircle2 size={16} />}
            onClick={onApprove}
            disabled={submitting}
          >
            اعتماد
          </Button>
        ) : null}
        {canPublishCourse(status) && onPublish ? (
          <Button size="sm" icon={<Send size={16} />} onClick={onPublish} disabled={submitting}>
            نشر
          </Button>
        ) : null}
        {canSuspendCourse(status) && onSuspend ? (
          <Button
            variant="secondary"
            size="sm"
            icon={<Shield size={16} />}
            onClick={onSuspend}
            disabled={submitting}
          >
            إيقاف
          </Button>
        ) : null}
        {canRejectCourse(status) && onReject ? (
          <Button
            variant="danger"
            size="sm"
            icon={<XCircle size={16} />}
            onClick={onReject}
            disabled={submitting}
          >
            رفض
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={16} />}
            onClick={onDelete}
            disabled={submitting}
          >
            حذف
          </Button>
        ) : null}
      </div>
    </div>
  );
}
