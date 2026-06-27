import { Star } from '@/icons';
import { useAdminReviewLabels } from '../../../hooks/useAdminReviewLabels';

interface ReviewStarsProps {
  rating: number;
  size?: number;
  showScore?: boolean;
}

export function ReviewStars({ rating, size = 16, showScore = true }: ReviewStarsProps) {
  const { starsAriaLabel, ratingOf } = useAdminReviewLabels();
  const value = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <span className="review-stars" aria-label={starsAriaLabel(value)}>
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < value;
        return (
          <Star
            key={index}
            size={size}
            className={filled ? 'review-star is-filled' : 'review-star'}
            {...(filled ? { fill: 'currentColor' } : {})}
            aria-hidden="true"
          />
        );
      })}
      {showScore ? <strong className="review-stars-score">{ratingOf(value)}</strong> : null}
    </span>
  );
}
