import { Clock } from '@/icons';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { fmtDuration } from './courseShared';

interface CourseCurriculumSummaryProps {
  course: any;
}

export function CourseCurriculumSummary({ course }: CourseCurriculumSummaryProps) {
  const sections = course.sections || [];

  if (!sections.length) {
    return (
      <Card className="admin-course-curriculum-card">
        <h3>المنهج الدراسي</h3>
        <p>لا توجد أقسام أو دروس بعد.</p>
      </Card>
    );
  }

  return (
    <Card className="admin-course-curriculum-card">
      <h3>المنهج الدراسي</h3>
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
                        {lesson.isPreview ? <Badge variant="info">معاينة</Badge> : null}
                        {lesson.isLocked ? <Badge variant="warning">مقفل</Badge> : null}
                      </div>
                    </div>
                    <span className="admin-course-lesson-meta">
                      <Clock size={14} aria-hidden="true" />
                      {fmtDuration(lesson.duration)}
                      {lesson.resources?.length ? ` · ${lesson.resources.length} موارد` : ''}
                      {lesson.videoUrl ? ' · فيديو' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted-count">لا توجد دروس في هذا القسم.</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
