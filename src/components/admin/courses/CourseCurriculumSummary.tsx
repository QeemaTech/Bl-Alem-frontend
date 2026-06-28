import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Clock, FileText, PlayCircle } from '@/icons';
import { cn } from '@/lib/cn';
import { useAdminCourseLabels } from '../../../hooks/useAdminCourseLabels';
import { mediaUrl } from '../../../utils/mediaUrl';
import {
  localizedLessonDescription,
  localizedLessonTitle,
  localizedResourceTitle,
  localizedSectionTitle,
} from '../../../utils/localizedContent';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';

interface CourseCurriculumSummaryProps {
  course: any;
}

export function CourseCurriculumSummary({ course }: CourseCurriculumSummaryProps) {
  const { t, i18n } = useTranslation('courses');
  const lang = i18n.language;
  const { fmtDuration } = useAdminCourseLabels();
  const sections = [...(course.sections || [])].sort((a, b) => a.order - b.order);
  const [openSections, setOpenSections] = useState<Set<number>>(() => new Set(sections.map((section) => section.id)));
  const [openLessons, setOpenLessons] = useState<Set<number>>(() => new Set());

  const toggleSection = (sectionId: number) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const toggleLesson = (lessonId: number) => {
    setOpenLessons((current) => {
      const next = new Set(current);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

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
        {sections.map((section) => {
          const isSectionOpen = openSections.has(section.id);
          const lessons = [...(section.lessons || [])].sort((a, b) => a.order - b.order);
          return (
            <div key={section.id} className={cn('admin-course-section', isSectionOpen && 'is-open')}>
              <button
                type="button"
                className="admin-course-section-toggle"
                aria-expanded={isSectionOpen}
                onClick={() => toggleSection(section.id)}
              >
                <ChevronDown size={18} className={cn('admin-course-accordion-chevron', isSectionOpen && 'is-open')} />
                <span className="admin-course-section-toggle-copy">
                  <strong>{localizedSectionTitle(section, lang)}</strong>
                  <span className="muted-count">
                    {t('admin.courses.detail.lessons', { count: lessons.length })}
                  </span>
                </span>
              </button>
              {isSectionOpen ? (
                <div className="admin-course-section-body">
                  {lessons.length ? (
                    <ul className="admin-course-lessons">
                      {lessons.map((lesson) => {
                        const isLessonOpen = openLessons.has(lesson.id);
                        const description = localizedLessonDescription(lesson, lang);
                        return (
                          <li key={lesson.id} className={cn('admin-course-lesson', isLessonOpen && 'is-open')}>
                            <button
                              type="button"
                              className="admin-course-lesson-toggle"
                              aria-expanded={isLessonOpen}
                              onClick={() => toggleLesson(lesson.id)}
                            >
                              <ChevronDown
                                size={16}
                                className={cn('admin-course-accordion-chevron', isLessonOpen && 'is-open')}
                              />
                              <span className="admin-course-lesson-title">
                                <span>{localizedLessonTitle(lesson, lang)}</span>
                                <div className="chip-row">
                                  {lesson.isPreview ? (
                                    <Badge variant="info">{t('admin.courses.curriculum.preview')}</Badge>
                                  ) : null}
                                  {lesson.isLocked ? (
                                    <Badge variant="warning">{t('admin.courses.curriculum.locked')}</Badge>
                                  ) : null}
                                </div>
                              </span>
                            </button>
                            <span className="admin-course-lesson-meta">
                              <Clock size={14} aria-hidden="true" />
                              {fmtDuration(lesson.duration)}
                              {lesson.resources?.length
                                ? ` · ${t('admin.courses.curriculum.resources', { count: lesson.resources.length })}`
                                : ''}
                              {lesson.videoUrl ? ` · ${t('admin.courses.curriculum.video')}` : ''}
                            </span>
                            {isLessonOpen ? (
                              <div className="admin-course-lesson-body">
                                {description ? (
                                  <p className="admin-course-lesson-description">{description}</p>
                                ) : (
                                  <p className="muted-count">{t('admin.courses.curriculum.noDescription')}</p>
                                )}
                                {lesson.videoUrl ? (
                                  <a
                                    href={mediaUrl(lesson.videoUrl)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="admin-course-lesson-link"
                                  >
                                    <PlayCircle size={16} />
                                    {t('admin.courses.curriculum.watchVideo')}
                                  </a>
                                ) : null}
                                {lesson.resources?.length ? (
                                  <ul className="admin-course-lesson-resources">
                                    {lesson.resources.map((resource: any) => (
                                      <li key={resource.id}>
                                        <a
                                          href={mediaUrl(resource.fileUrl)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="admin-course-lesson-link"
                                        >
                                          <FileText size={16} />
                                          {localizedResourceTitle(resource, lang)}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="muted-count">{t('admin.courses.curriculum.noLessonsInSection')}</p>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
