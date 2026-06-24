import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, PlayCircle, Star, UserRound } from '@/icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

const statusLabels: Record<string, string> = {
  ACTIVE: 'قيد التعلم',
  COMPLETED: 'مكتملة',
};

const statusVariant = (status: string) => (status === 'COMPLETED' ? 'success' as const : 'info' as const);

const fmtDate = (value?: string) => (value
  ? new Date(value).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
  : '—');

interface MyCourseCardProps {
  item: any;
  style?: CSSProperties;
}

export function MyCourseCard({ item, style }: MyCourseCardProps) {
  const navigate = useNavigate();
  const progress = Number(item.progressPercentage || 0);
  const isCompleted = item.status === 'COMPLETED' || progress >= 100;
  const quizCount = item.course?.quizzes?.length || 0;
  const lessonCount = item.course?._count?.lessons || 0;

  return (
    <Card
      className={`my-course-card enhanced ${isCompleted ? 'completed' : ''}`}
      style={style}
    >
      <div className="course-cover">
        {item.course?.coverImage ? (
          <img src={item.course.coverImage} alt="" />
        ) : (
          <span className="course-cover-fallback"><BookOpen size={36} /></span>
        )}
        <Badge variant={statusVariant(item.status)} className="my-course-status-badge">
          {statusLabels[item.status] || item.status}
        </Badge>
      </div>
      <div className="my-course-card-body">
        <div className="my-course-card-top">
          <span className="my-course-category">{item.course?.category?.nameAr || 'دورة'}</span>
          <h3>{item.course?.titleAr}</h3>
          <p className="my-course-instructor">
            <UserRound size={14} />
            <span>{item.course?.instructor?.fullName || '—'}</span>
          </p>
          <div className="my-course-meta">
            <span>{lessonCount} درس</span>
            {quizCount ? <span>{quizCount} اختبار</span> : null}
            <span>{fmtDate(item.enrolledAt)}</span>
          </div>
          {quizCount && !isCompleted ? (
            <Badge variant="info" className="my-course-quiz-badge">اختبارات معلّقة</Badge>
          ) : null}
        </div>
        <div className="my-course-card-progress">
          <ProgressBar value={progress} label="التقدم" size="md" />
        </div>
        <div className="my-course-actions">
          <Button
            fullWidth
            className="my-course-cta"
            variant={isCompleted ? 'secondary' : 'primary'}
            icon={isCompleted ? <CheckCircle2 size={16} /> : <PlayCircle size={16} />}
            onClick={() => navigate(`/student/player/${item.courseId}`)}
          >
            {isCompleted ? 'مراجعة الدورة' : 'استكمال'}
          </Button>
          {isCompleted ? (
            <Button
              fullWidth
              className="my-course-rate-btn"
              variant="outline"
              icon={<Star size={16} />}
              onClick={() => navigate(`/student/courses/${item.courseId}?tab=reviews`)}
            >
              {item.myReview ? 'تعديل تقييمك' : 'قيّم الدورة'}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
