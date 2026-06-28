import type { CSSProperties } from 'react';
import {
  BookOpen, Clock, Eye, GraduationCap, Layers, PlayCircle, Star, UserPlus, UserRound,
} from '@/icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useStudentCourseLabels } from '../../hooks/useStudentCourseLabels';
import { localizedCategoryName, localizedCourseTitle } from '../../utils/localizedContent';
import { formatMoney } from '../../utils/formatMoney';
import { mediaUrl } from '../../utils/mediaUrl';

interface StudentCourseCardProps {
  course: any;
  isEnrolled: boolean;
  onPrimaryAction: () => void;
  style?: CSSProperties;
  compact?: boolean;
}

export function StudentCourseCard({
  course,
  isEnrolled,
  onPrimaryAction,
  style,
  compact = false,
}: StudentCourseCardProps) {
  const {
    lang,
    getLevelLabel,
    getPrimaryActionLabel,
    fmtLessons,
    badgeLabels,
    courseFallback,
    freePrice,
  } = useStudentCourseLabels();

  const coverSrc = mediaUrl(course.coverImage);
  const price = Number(course.discountPrice ?? course.price ?? 0);
  const originalPrice = Number(course.price ?? 0);
  const hasDiscount = course.discountPrice != null && course.discountPrice < originalPrice;
  const isFree = price === 0;
  const rating = Number(course.ratingAverage || 0);
  const lessonCount = course._count?.lessons || 0;
  const categoryName = localizedCategoryName(course.category, lang) || courseFallback;
  const levelLabel = getLevelLabel(course.level);
  const courseTitle = localizedCourseTitle(course, lang);

  const primaryLabel = getPrimaryActionLabel(isEnrolled, isFree);
  const PrimaryIcon = isEnrolled ? PlayCircle : isFree ? UserPlus : Eye;

  const statusBadge = isEnrolled
    ? { label: badgeLabels.enrolled, variant: 'success' as const }
    : isFree
      ? { label: badgeLabels.free, variant: 'info' as const }
      : hasDiscount
        ? { label: badgeLabels.discount, variant: 'warning' as const }
        : null;

  return (
    <Card
      className={`student-course-card ${isEnrolled ? 'is-enrolled' : ''} ${compact ? 'is-compact' : ''}`}
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
        {statusBadge ? (
          <Badge variant={statusBadge.variant} className="student-course-status-badge">
            {statusBadge.label}
          </Badge>
        ) : null}
        <span className="student-course-category-icon" title={categoryName}>
          <Layers size={14} />
        </span>
      </div>

      <div className="student-course-card-body">
        <div className="student-course-card-top">
          <span className="student-course-category">{categoryName}</span>
          <h3>{courseTitle}</h3>
          <p className="student-course-instructor">
            <UserRound size={13} />
            <span>{course.instructor?.fullName || '—'}</span>
          </p>
          <div className="student-course-meta">
            <span><Clock size={12} /> {fmtLessons(lessonCount)}</span>
            {levelLabel ? (
              <span><GraduationCap size={12} /> {levelLabel}</span>
            ) : null}
            {rating > 0 ? (
              <span className="student-course-rating">
                <Star size={12} fill="currentColor" />
                {rating.toFixed(1)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="student-course-price-row">
          {isFree ? (
            <strong className="student-course-price-free">{freePrice}</strong>
          ) : (
            <>
              <strong className="student-course-price">{formatMoney(price)}</strong>
              {hasDiscount ? (
                <span className="student-course-price-old">{formatMoney(originalPrice)}</span>
              ) : null}
            </>
          )}
        </div>

        <div className="student-course-actions">
          <Button
            fullWidth
            className="student-course-cta"
            variant="primary"
            icon={<PrimaryIcon size={14} />}
            onClick={onPrimaryAction}
          >
            {primaryLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}
