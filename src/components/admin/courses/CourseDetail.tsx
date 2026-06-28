import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  CheckCircle2,
  Image,
  Info,
  Layers,
  Send,
  Shield,
  Star,
  Trash2,
  Users,
  XCircle,
} from '@/icons';
import { useAdminCourseLabels } from '../../../hooks/useAdminCourseLabels';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { mediaUrl } from '../../../utils/mediaUrl';
import {
  localizedCategoryName,
  localizedCourseShortDescription,
  localizedCourseTitle,
} from '../../../utils/localizedContent';
import {
  canApproveCourse,
  canPublishCourse,
  canRejectCourse,
  canSuspendCourse,
  getCourseStats,
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
  const { t, i18n } = useTranslation('courses');
  const lang = i18n.language;
  const {
    statusLabels,
    levelLabels,
    typeLabels,
    fmtDate,
    fmtMoney,
    statusVariant,
    empty,
  } = useAdminCourseLabels();
  const stats = getCourseStats(course);
  const status = String(course.status || '');
  const courseTitle = localizedCourseTitle(course, lang);
  const alternateTitle = lang.startsWith('en')
    ? course.titleAr?.trim()
    : course.titleEn?.trim();
  const showAlternateTitle = Boolean(alternateTitle && alternateTitle !== courseTitle);
  const categoryName = localizedCategoryName(course.category, lang);
  const shortDescription = localizedCourseShortDescription(
    course,
    lang,
    t('admin.courses.detail.noShortDesc'),
  );
  const courseLanguageLabel = course.language === 'en'
    ? t('form.languages.en')
    : course.language === 'ar-en'
      ? t('form.languages.ar-en')
      : t('form.languages.ar');

  return (
    <div className="support-ticket-detail admin-course-detail admin-entity-detail">
      <div className="admin-entity-detail-header support-ticket-detail-header">
        <div className="admin-course-detail-heading">
          <span className="support-ticket-id">#{course.id}</span>
          <div className="admin-course-title-row">
            <span className="admin-entity-detail-icon" aria-hidden="true">
              <BookOpen size={24} />
            </span>
            <h2>{courseTitle}</h2>
          </div>
          {showAlternateTitle ? <p className="admin-course-subtitle">{alternateTitle}</p> : null}
          <p className="admin-course-instructor">
            {t('admin.courses.detail.instructor')}: <strong>{course.instructor?.fullName || empty}</strong>
            {course.instructor?.email ? (
              <span dir="ltr" className="admin-course-instructor-email">{course.instructor.email}</span>
            ) : null}
          </p>
        </div>
        <Badge variant={statusVariant(status)} dot className="status-badge">
          {statusLabels[status] || status}
        </Badge>
      </div>

      <section className="admin-course-overview" aria-label={t('admin.courses.detail.overviewAriaLabel')}>
        <div className="admin-course-overview-layout">
          <div className="admin-course-overview-media">
            {course.coverImage ? (
              <img
                src={mediaUrl(course.coverImage)}
                alt={courseTitle}
                className="admin-course-overview-cover"
              />
            ) : (
              <div className="admin-course-overview-cover is-placeholder" aria-hidden="true">
                <Image size={28} />
                <span>{t('admin.courses.detail.noCover')}</span>
              </div>
            )}
          </div>
          <div className="admin-course-overview-copy">
            <div className="admin-course-tags">
              <Badge variant="info">{levelLabels[course.level] || course.level}</Badge>
              <Badge variant="default">{typeLabels[course.type] || course.type}</Badge>
              {categoryName ? (
                <Badge variant="default">{categoryName}</Badge>
              ) : null}
            </div>
            <p className="admin-course-short-desc">
              {shortDescription}
            </p>
          </div>
        </div>
      </section>

      <div className="admin-course-stats-row">
        <div className="admin-course-stat">
          <Layers size={18} aria-hidden="true" />
          <span>{t('admin.courses.detail.sections', { count: stats.sections })}</span>
        </div>
        <div className="admin-course-stat">
          <BookOpen size={18} aria-hidden="true" />
          <span>{t('admin.courses.detail.lessons', { count: stats.lessons })}</span>
        </div>
        <div className="admin-course-stat">
          <Users size={18} aria-hidden="true" />
          <span>{t('admin.courses.detail.students', { count: stats.students })}</span>
        </div>
        <div className="admin-course-stat">
          <Star size={18} aria-hidden="true" />
          <span>{stats.rating} ({t('admin.courses.detail.reviews', { count: stats.reviews })})</span>
        </div>
      </div>

      <section className="admin-entity-meta" aria-label={t('admin.courses.detail.metaAriaLabel')}>
        <div className="admin-entity-meta-head">
          <span className="admin-entity-meta-head-icon" aria-hidden="true">
            <Info size={20} />
          </span>
          <h3>{t('admin.courses.detail.metaTitle')}</h3>
        </div>
        <div className="admin-entity-meta-grid">
          <div className="detail-row">
            <span className="detail-row-label">{t('admin.courses.detail.category')}</span>
            <div className="detail-row-value">{categoryName || empty}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{t('admin.courses.detail.level')}</span>
            <div className="detail-row-value">{levelLabels[course.level] || course.level}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{t('admin.courses.detail.price')}</span>
            <div className="detail-row-value">{fmtMoney(course)}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{t('admin.courses.detail.language')}</span>
            <div className="detail-row-value">
              {courseLanguageLabel}
            </div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{t('admin.courses.detail.lessonCount')}</span>
            <div className="detail-row-value">{stats.lessons}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{t('admin.courses.detail.studentCount')}</span>
            <div className="detail-row-value">{stats.students}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{t('admin.courses.detail.createdAt')}</span>
            <div className="detail-row-value">{fmtDate(course.createdAt, true)}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{t('admin.courses.detail.updatedAt')}</span>
            <div className="detail-row-value">{fmtDate(course.updatedAt, true)}</div>
          </div>
          {course.rejectionReason ? (
            <div className="detail-row">
              <span className="detail-row-label">{t('admin.courses.detail.rejectionReason')}</span>
              <div className="detail-row-value">{course.rejectionReason}</div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="admin-entity-detail-actions">
        {canApproveCourse(status) && onApprove ? (
          <Button
            variant="secondary"
            size="sm"
            icon={<CheckCircle2 size={16} />}
            onClick={onApprove}
            disabled={submitting}
          >
            {t('admin.actions.approve')}
          </Button>
        ) : null}
        {canPublishCourse(status) && onPublish ? (
          <Button size="sm" icon={<Send size={16} />} onClick={onPublish} disabled={submitting}>
            {t('admin.actions.publish')}
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
            {t('admin.actions.suspend')}
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
            {t('admin.actions.reject')}
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
            {t('admin.actions.delete')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
