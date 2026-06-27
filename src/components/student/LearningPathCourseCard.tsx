import type { CSSProperties } from 'react';
import {
  BookOpen, CheckCircle2, Clock, Eye, PlayCircle, UserRound,
} from '@/icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
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

const statusLabel = (enrollment?: EnrollmentInfo) => {
  if (!enrollment) return 'غير مسجّل';
  const progress = Number(enrollment.progressPercentage || 0);
  if (enrollment.status === 'COMPLETED' || progress >= 100) return 'مكتمل';
  return 'قيد التعلم';
};

const statusVariant = (enrollment?: EnrollmentInfo) => {
  if (!enrollment) return 'default' as const;
  const progress = Number(enrollment.progressPercentage || 0);
  if (enrollment.status === 'COMPLETED' || progress >= 100) return 'success' as const;
  return 'info' as const;
};

export function LearningPathCourseCard({
  stepNumber,
  course,
  enrollment,
  onPrimaryAction,
  onViewDetails,
  style,
}: LearningPathCourseCardProps) {
  const progress = Number(enrollment?.progressPercentage || 0);
  const isCompleted = enrollment && (enrollment.status === 'COMPLETED' || progress >= 100);
  const isEnrolled = Boolean(enrollment);
  const lessonCount = course?._count?.lessons || 0;
  const categoryName = course?.category?.nameAr || 'دورة';
  const price = Number(course?.discountPrice ?? course?.price ?? 0);
  const coverSrc = mediaUrl(course?.coverImage);

  const primaryLabel = isCompleted ? 'مراجعة' : isEnrolled ? 'استكمال' : 'عرض الدورة';
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
        <Badge variant={statusVariant(enrollment)} className="learning-path-course-status">
          {statusLabel(enrollment)}
        </Badge>
        <span className="learning-path-course-step" aria-label={`الخطوة ${stepNumber}`}>
          {stepNumber}
        </span>
      </div>

      <div className="learning-path-course-body">
        <div className="learning-path-course-top">
          <div className="learning-path-course-head">
            <span className="learning-path-course-category">{categoryName}</span>
          </div>
          <h3>{course?.titleAr}</h3>
          <p className="learning-path-course-instructor">
            <UserRound size={13} />
            <span>{course?.instructor?.fullName || '—'}</span>
          </p>
          <div className="learning-path-course-meta">
            <span><Clock size={12} /> {lessonCount} درس</span>
            {!isEnrolled && price > 0 ? (
              <span className="learning-path-course-price">{price} ج.م</span>
            ) : null}
          </div>
        </div>

        {isEnrolled ? (
          <div className="learning-path-course-progress">
            <ProgressBar value={progress} label="التقدم" size="sm" />
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
              التفاصيل
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
