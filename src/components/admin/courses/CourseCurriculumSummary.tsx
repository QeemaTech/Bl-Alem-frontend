import { useTranslation } from 'react-i18next';
import { Clock } from '@/icons';
import { useAdminCourseLabels } from '../../../hooks/useAdminCourseLabels';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';

interface CourseCurriculumSummaryProps {
  course: any;
}

export function CourseCurriculumSummary({ course }: CourseCurriculumSummaryProps) {
  const { t } = useTranslation('courses');
  const { fmtDuration } = useAdminCourseLabels();
  const sections = course.sections || [];

  if (!sections.length) {
    return (
      <Card className="admin-course-curriculum-card">
        <h3>{t('admin.courses.curriculum.title')}</h3>
        <p>{t('admin.courses.curriculum.empty')}</p>
      </Card>
    );
  }

  return (
    <Card className="admin-course-curriculum-card">
      <h3>{t('admin.courses.curriculum.title')}</h3>
      <div className="admin-course-curriculum">
        {sections.map((section: any) => (
          <div key={section.id} className="admin-course-section">
            <h4>{section.titleAr}</h4>
            {section.lessons?.length ? (
              <ul className="admin-course-lessons">
                {section.lessons.map((lesson: any) => (
                  <li key={lesson.id} className="admin-course-lesson">
                    <div className="admin-course-lesson-title">
                      <span>{lesson.titleAr}</span>
                      <div className="chip-row">
                        {lesson.isPreview ? <Badge variant="info">{t('admin.courses.curriculum.preview')}</Badge> : null}
                        {lesson.isLocked ? <Badge variant="warning">{t('admin.courses.curriculum.locked')}</Badge> : null}
                      </div>
                    </div>
                    <span className="admin-course-lesson-meta">
                      <Clock size={14} aria-hidden="true" />
                      {fmtDuration(lesson.duration)}
                      {lesson.resources?.length
                        ? ` · ${t('admin.courses.curriculum.resources', { count: lesson.resources.length })}`
                        : ''}
                      {lesson.videoUrl ? ` · ${t('admin.courses.curriculum.video')}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted-count">{t('admin.courses.curriculum.noLessonsInSection')}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
