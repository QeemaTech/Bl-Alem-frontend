import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen, CheckCircle2, Clock, Eye, PlayCircle, UserRound,
} from '@/icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { useStudentCourseLabels } from '../../hooks/useStudentCourseLabels';
import { localizedCategoryName, localizedCourseTitle } from '../../utils/localizedContent';
import { formatMoney } from '../../utils/formatMoney';
import { mediaUrl } from '../../utils/mediaUrl';

type EnrollmentInfo = {
  status: string;
  progressPercentage: number;
};

interface LearningPathCourseCardProps {
  stepNumber: number;
  course: any;
  enrollment?: EnrollmentInfo;
  onPrimaryAction: () => void;
  onViewDetails: () => void;
  style?: CSSProperties;
}

export function LearningPathCourseCard({
  stepNumber,
  course,
  enrollment,
  onPrimaryAction,
  onViewDetails,
  style,
}: LearningPathCourseCardProps) {
  const { t } = useTranslation('learningPaths');
  const {
    lang,
    fmtLessons,
    actionLabels,
    courseFallback,
    progress,
  } = useStudentCourseLabels();

  const progressValue = Number(enrollment?.progressPercentage || 0);
  const isCompleted = enrollment && (enrollment.status === 'COMPLETED' || progressValue >= 100);
  const isEnrolled = Boolean(enrollment);
  const lessonCount = course?._count?.lessons || 0;
  const categoryName = localizedCategoryName(course?.category, lang) || courseFallback;
  const courseTitle = localizedCourseTitle(course, lang);
  const price = Number(course?.discountPrice ?? course?.price ?? 0);
  const coverSrc = mediaUrl(course?.coverImage);

  const statusKey = !enrollment
    ? 'notEnrolled'
    : isCompleted
      ? 'completed'
      : 'inProgress';
  const statusLabelText = t(`student.labels.status.${statusKey}`);
  const statusVariantValue = !enrollment
    ? 'default' as const
    : isCompleted
      ? 'success' as const
      : 'info' as const;

  const primaryLabel = isCompleted
    ? actionLabels.review
    : isEnrolled
      ? actionLabels.continue
      : actionLabels.viewCourse;
  const PrimaryIcon = isCompleted ? CheckCircle2 : isEnrolled ? PlayCircle : Eye;

  return (
    <Card
      className={`learning-path-course-card ${isCompleted ? 'is-completed' : isEnrolled ? 'is-enrolled' : ''}`}
      style={style}
    >
      <div className="course-cover">
        {coverSrc ? (
          <img src={coverSrc} alt="" loading="lazy" />
        ) : (
          <span className="course-cover-fallback" aria-hidden>
            <BookOpen size={24} />
          </span>
        )}
        <Badge variant={statusVariantValue} className="learning-path-course-status">
          {statusLabelText}
        </Badge>
        <span className="learning-path-course-step" aria-label={t('student.labels.stepAria', { number: stepNumber })}>
          {stepNumber}
        </span>
      </div>

      <div className="learning-path-course-body">
        <div className="learning-path-course-top">
          <div className="learning-path-course-head">
            <span className="learning-path-course-category">{categoryName}</span>
          </div>
          <h3>{courseTitle}</h3>
          <p className="learning-path-course-instructor">
            <UserRound size={13} />
            <span>{course?.instructor?.fullName || '—'}</span>
          </p>
          <div className="learning-path-course-meta">
            <span><Clock size={12} /> {fmtLessons(lessonCount)}</span>
            {!isEnrolled && price > 0 ? (
              <span className="learning-path-course-price">{formatMoney(price)}</span>
            ) : null}
          </div>
        </div>

        {isEnrolled ? (
          <div className="learning-path-course-progress">
            <ProgressBar value={progressValue} label={progress} size="sm" />
          </div>
        ) : null}

        <div className="learning-path-course-actions">
          <Button
            size="sm"
            className="learning-path-course-cta"
            variant={isCompleted ? 'secondary' : 'primary'}
            icon={<PrimaryIcon size={14} />}
            onClick={onPrimaryAction}
          >
            {primaryLabel}
          </Button>
          {!isEnrolled ? (
            <Button
              size="sm"
              variant="outline"
              className="learning-path-course-details-btn"
              icon={<Eye size={14} />}
              onClick={onViewDetails}
            >
              {actionLabels.details}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
