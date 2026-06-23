import { FormEvent, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { studentApi } from '../../api/student';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

interface ReviewData {
  id?: number;
  rating: number;
  comment?: string | null;
}

interface CourseReviewFormProps {
  courseId: number | string;
  myReview?: ReviewData | null;
  onSuccess: () => void;
}

export function CourseReviewForm({ courseId, myReview, onSuccess }: CourseReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment || '');
    }
  }, [myReview]);

  const displayRating = hoverRating || rating;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!rating) return;
    setLoading(true);
    setError('');
    try {
      await studentApi.createReview(courseId, {
        rating,
        comment: comment.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذّر حفظ التقييم. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="course-review-form" onSubmit={handleSubmit}>
      <h3>{myReview ? 'تعديل تقييمك' : 'قيّم هذه الدورة'}</h3>
      <div className="star-rating" role="radiogroup" aria-label="التقييم">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`star-rating-btn ${value <= displayRating ? 'active' : ''}`}
            onClick={() => setRating(value)}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`${value} من 5`}
            aria-checked={rating === value}
            role="radio"
          >
            <Star size={28} fill={value <= displayRating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <Textarea
        label="تعليق (اختياري)"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="شاركنا تجربتك مع هذه الدورة..."
        rows={4}
      />
      {error ? <p className="course-review-form-error">{error}</p> : null}
      <Button type="submit" loading={loading} disabled={!rating}>
        {myReview ? 'تحديث التقييم' : 'إرسال التقييم'}
      </Button>
    </form>
  );
}
