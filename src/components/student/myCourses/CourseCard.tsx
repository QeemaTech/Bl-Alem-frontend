import { memo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Award, BookOpen, Calendar, Clock, Layers, PlayCircle, UserRound,
} from '@/icons';
import { useStudentCourseLabels } from '../../../hooks/useStudentCourseLabels';
import { useStudentMyCourseLabels } from '../../../hooks/useStudentMyCourseLabels';
import { localizedCategoryName, localizedCourseTitle } from '../../../utils/localizedContent';
import { mediaUrl } from '../../../utils/mediaUrl';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { CourseProgress } from './CourseProgress';
import type { MyCourseEnrollment } from './types';
import { getDisplayStatus, STATUS_VARIANT } from './utils';

interface CourseCardProps {
  item: MyCourseEnrollment;
  style?: CSSProperties;
}

function CourseCardComponent({ item, style }: CourseCardProps) {
  const { t } = useTranslation('courses');
  const { lang, fmtLessons, courseFallback } = useStudentCourseLabels();
  const { getStatusLabel, fmtDate, formatDuration } = useStudentMyCourseLabels();
  const navigate = useNavigate();
  const progress = Number(item.progressPercentage || 0);
  const displayStatus = getDisplayStatus(item);
  const isCompleted = displayStatus === 'COMPLETED';
  const coverSrc = mediaUrl(item.course?.coverImage);
  const categoryName = localizedCategoryName(item.course?.category, lang) || courseFallback;
  const courseTitle = localizedCourseTitle(item.course, lang);
  const lessonCount = item.course?._count?.lessons || 0;
  const durationLabel = formatDuration(item.course?.duration);
  const lastActivity = item.completedAt || item.enrolledAt;

  const handlePrimaryAction = () => {
    if (isCompleted) {
      navigate('/student/certificates');
      return;
    }
    navigate(`/student/player/${item.courseId}`);
  };

  return (
    <Card
      className={`student-my-course-card ${isCompleted ? 'is-completed' : ''}`}
      style={style}
    >
      <div className="student-my-course-cover">
        {coverSrc ? (
          <img src={coverSrc} alt="" loading="lazy" />
        ) : (
          <span className="student-my-course-cover-fallback" aria-hidden>
            <BookOpen size={32} />
          </span>
        )}
        <span className="student-my-course-cover-overlay" aria-hidden />
        <Badge variant={STATUS_VARIANT(displayStatus)} className="student-my-course-status-badge">
          {getStatusLabel(displayStatus)}
        </Badge>
        <span className="student-my-course-category-icon" title={categoryName}>
          <Layers size={16} />
        </span>
      </div>

      <div className="student-my-course-body">
        <div className="student-my-course-content">
          <span className="student-my-course-category">{categoryName}</span>
          <h3 className="student-my-course-title">{courseTitle}</h3>
          <p className="student-my-course-instructor">
            <UserRound size={14} aria-hidden />
            <span>{item.course?.instructor?.fullName || '—'}</span>
          </p>
          <div className="student-my-course-meta">
            {durationLabel ? (
              <span><Clock size={13} aria-hidden /> {durationLabel}</span>
            ) : lessonCount ? (
              <span><BookOpen size={13} aria-hidden /> {fmtLessons(lessonCount)}</span>
            ) : null}
            <span><Calendar size={13} aria-hidden /> {fmtDate(lastActivity)}</span>
          </div>
        </div>

        <CourseProgress value={progress} />

        <div className="student-my-course-footer">
          <Button
            fullWidth
            className="student-my-course-cta"
            variant={isCompleted ? 'secondary' : 'primary'}
            icon={isCompleted ? <Award size={16} /> : <PlayCircle size={16} />}
            onClick={handlePrimaryAction}
          >
            {isCompleted
              ? t('student.myCourses.actions.viewCertificate')
              : t('student.myCourses.actions.continueLearning')}
          </Button>
          <Button
            fullWidth
            variant="outline"
            className="student-my-course-details-btn"
            onClick={() => navigate(`/student/courses/${item.courseId}`)}
          >
            {t('student.myCourses.actions.courseDetails')}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export const CourseCard = memo(CourseCardComponent);
