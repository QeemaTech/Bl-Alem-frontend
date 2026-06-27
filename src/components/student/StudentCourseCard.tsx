import type { CSSProperties } from 'react';
import {
  BookOpen, Clock, Eye, GraduationCap, Layers, PlayCircle, Star, UserPlus, UserRound,
} from '@/icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { formatMoney } from '../../utils/formatMoney';
import { mediaUrl } from '../../utils/mediaUrl';

const levelLabels: Record<string, string> = {
  BEGINNER: 'مبتدئ',
  INTERMEDIATE: 'متوسط',
  ADVANCED: 'متقدم',
};

interface StudentCourseCardProps {
  course: any;
  isEnrolled: boolean;
  onPrimaryAction: () => void;
  style?: CSSProperties;
}

export function StudentCourseCard({
  course,
  isEnrolled,
  onPrimaryAction,
  style,
}: StudentCourseCardProps) {
  const coverSrc = mediaUrl(course.coverImage);
  const price = Number(course.discountPrice ?? course.price ?? 0);
  const originalPrice = Number(course.price ?? 0);
  const hasDiscount = course.discountPrice != null && course.discountPrice < originalPrice;
  const isFree = price === 0;
  const rating = Number(course.ratingAverage || 0);
  const lessonCount = course._count?.lessons || 0;
  const categoryName = course.category?.nameAr || 'دورة';
  const levelLabel = levelLabels[course.level] || '';

  const primaryLabel = isEnrolled ? 'استكمال' : isFree ? 'اشتراك' : 'عرض الدورة';
  const PrimaryIcon = isEnrolled ? PlayCircle : isFree ? UserPlus : Eye;

  const statusBadge = isEnrolled
    ? { label: 'مسجّل', variant: 'success' as const }
    : isFree
      ? { label: 'مجاني', variant: 'info' as const }
      : hasDiscount
        ? { label: 'خصم', variant: 'warning' as const }
        : null;

  return (
    <Card
      className={`student-course-card ${isEnrolled ? 'is-enrolled' : ''}`}
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
          <h3>{course.titleAr}</h3>
          <p className="student-course-instructor">
            <UserRound size={13} />
            <span>{course.instructor?.fullName || '—'}</span>
          </p>
          <div className="student-course-meta">
            <span><Clock size={12} /> {lessonCount} درس</span>
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
            <strong className="student-course-price-free">مجاني</strong>
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
