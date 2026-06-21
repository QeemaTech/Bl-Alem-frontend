import { useEffect, useState } from 'react';
import { BookOpen, Clock, Star } from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';

const isValidImageUrl = (url?: string) => Boolean(
  url && (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')),
);

interface CourseCardProps {
  title: string;
  category: string;
  instructor?: string;
  imageUrl?: string;
  price?: number;
  rating?: number;
  progress?: number;
  duration?: string;
  status?: string;
  statusVariant?: 'default' | 'active' | 'pending' | 'published' | 'completed' | 'success' | 'info';
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function CourseCard({
  title,
  category,
  instructor,
  imageUrl,
  price,
  rating,
  progress = 0,
  duration = 'غير محدد',
  status,
  statusVariant = 'default',
  actionLabel,
  onAction,
  className = '',
}: CourseCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = isValidImageUrl(imageUrl) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <Card className={`course-card discovery-card ${className}`}>
      <div className="course-cover">
        {showImage ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="course-cover-fallback" aria-hidden><BookOpen size={36} /></span>
        )}
      </div>
      <div className="course-meta">
        <Badge variant="default">{category}</Badge>
        {status ? <Badge variant={statusVariant}>{status}</Badge> : null}
      </div>
      <h3>{title}</h3>
      {instructor ? <p>المحاضر: {instructor}</p> : null}
      <p><Clock size={15} /> {duration}</p>
      {(rating !== undefined || price !== undefined) && (
        <div className="course-meta">
          {rating !== undefined ? (
            <span className="course-rating"><Star size={15} fill="currentColor" /> {rating.toFixed(1)}</span>
          ) : null}
          {price !== undefined ? (
            <span className="price-line"><strong>{price} ر.س</strong></span>
          ) : null}
        </div>
      )}
      {progress > 0 ? <ProgressBar value={progress} label="التقدم" /> : null}
      {actionLabel && onAction ? (
        <Button size="sm" fullWidth onClick={onAction}>{actionLabel}</Button>
      ) : null}
    </Card>
  );
}
