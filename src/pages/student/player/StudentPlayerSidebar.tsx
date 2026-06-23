import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2, ChevronDown, ClipboardList, FileText, Lock, PlayCircle, Video,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  buildSectionCurriculum,
  findSectionIdForLesson,
  fmtDuration,
  getCourseProgress,
  getItemCompletion,
  getSectionProgress,
  isLessonLocked,
  isQuizUnlocked,
  type CurriculumItem,
  type SectionCurriculum,
} from './buildCurriculum';

interface StudentPlayerSidebarProps {
  courseTitle: string;
  sections: any[];
  quizzes: any[];
  activeLessonId: number | null;
  completedLessonIds: Set<number>;
  enrolled: boolean;
  onSelectLesson: (lessonId: number) => void;
  onSelectResources: (lessonId: number) => void;
}

function ItemIcon({ item, state }: { item: CurriculumItem; state: 'done' | 'active' | 'locked' | 'default' }) {
  if (state === 'done') return <CheckCircle2 size={16} className="curriculum-icon done" />;
  if (state === 'locked') return <Lock size={16} className="curriculum-icon locked" />;
  if (item.type === 'quiz') return <ClipboardList size={16} className="curriculum-icon" />;
  if (item.type === 'resources') return <FileText size={16} className="curriculum-icon" />;
  if (state === 'active') return <PlayCircle size={16} className="curriculum-icon active" />;
  return <Video size={16} className="curriculum-icon" />;
}

export function StudentPlayerSidebar({
  courseTitle,
  sections,
  quizzes,
  activeLessonId,
  completedLessonIds,
  enrolled,
  onSelectLesson,
  onSelectResources,
}: StudentPlayerSidebarProps) {
  const navigate = useNavigate();
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  const curriculum = useMemo(() => {
    const sortedSections = [...(sections || [])].sort((a, b) => a.order - b.order);
    const lastSectionId = sortedSections[sortedSections.length - 1]?.id;

    return sortedSections.map((section) => {
      const items = buildSectionCurriculum(section, quizzes, {
        includeCourseQuizzes: section.id === lastSectionId,
      });
      return {
        section,
        items,
        progress: getSectionProgress(items, completedLessonIds),
      } satisfies SectionCurriculum;
    });
  }, [sections, quizzes, completedLessonIds]);

  const courseProgress = useMemo(
    () => getCourseProgress(curriculum, completedLessonIds),
    [curriculum, completedLessonIds],
  );

  const activeSectionId = findSectionIdForLesson(sections, activeLessonId);

  const [expandedSections, setExpandedSections] = useState<Set<number>>(() => (
    new Set((sections || []).map((section) => section.id))
  ));

  useEffect(() => {
    setExpandedSections((current) => {
      const next = new Set(current);
      (sections || []).forEach((section) => next.add(section.id));
      return next;
    });
  }, [sections]);

  useEffect(() => {
    if (!activeSectionId) return;
    setExpandedSections((current) => {
      if (current.has(activeSectionId)) return current;
      const next = new Set(current);
      next.add(activeSectionId);
      return next;
    });
  }, [activeSectionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      activeItemRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [activeLessonId]);

  const toggleSection = (sectionId: number) => {
    setExpandedSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const getItemState = (
    item: CurriculumItem,
    sectionItems: CurriculumItem[],
  ): 'done' | 'active' | 'locked' | 'default' => {
    const done = getItemCompletion(item, completedLessonIds);

    if (item.type === 'lesson') {
      const locked = isLessonLocked(item.lesson, enrolled);
      if (locked) return 'locked';
      if (item.lessonId === activeLessonId) return 'active';
      if (done) return 'done';
      return 'default';
    }

    if (item.type === 'resources') {
      const resourceLessonIds = [...new Set((item.resources || []).map((resource) => resource.lessonId))];
      if (activeLessonId && resourceLessonIds.includes(activeLessonId)) return 'active';
      if (done) return 'done';
      return 'default';
    }

    if (item.type === 'quiz') {
      const locked = !isQuizUnlocked(sectionItems, completedLessonIds);
      if (locked) return 'locked';
      if (item.quiz?.isCompleted) return 'done';
      return 'default';
    }

    return 'default';
  };

  const handleItemClick = (item: CurriculumItem, sectionItems: CurriculumItem[]) => {
    if (item.type === 'lesson' && item.lessonId) {
      if (isLessonLocked(item.lesson, enrolled)) return;
      onSelectLesson(item.lessonId);
      return;
    }

    if (item.type === 'resources') {
      const lessonIds = [...new Set((item.resources || []).map((resource) => resource.lessonId))];
      const targetLessonId = activeLessonId && lessonIds.includes(activeLessonId)
        ? activeLessonId
        : lessonIds[0];
      if (targetLessonId) onSelectResources(targetLessonId);
      return;
    }

    if (item.type === 'quiz' && item.quiz?.id) {
      if (!isQuizUnlocked(sectionItems, completedLessonIds) || !item.quiz.isReady) return;
      navigate(`/student/quizzes/${item.quiz.id}`);
    }
  };

  return (
    <aside className="player-sidebar student-player-sidebar">
      <div className="student-player-sidebar-head">
        <h3>{courseTitle}</h3>
        <div className="student-player-sidebar-overall">
          <div className="student-player-sidebar-overall-label">
            <span className="overall-count">{courseProgress.completed} / {courseProgress.total}</span>
            <span className="overall-percent">{courseProgress.percent}% مكتمل</span>
          </div>
          <div className="student-curriculum-section-bar overall" aria-hidden>
            <span style={{ width: `${courseProgress.percent}%` }} />
          </div>
        </div>
      </div>

      <div className="student-player-curriculum">
        {curriculum.map(({ section, items, progress }) => {
          const isExpanded = expandedSections.has(section.id);

          return (
            <div
              key={section.id}
              className={`student-curriculum-section ${isExpanded ? 'expanded' : 'collapsed'}`}
            >
              <button
                type="button"
                className="student-curriculum-section-header"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isExpanded}
              >
                <div className="student-curriculum-section-title-wrap">
                  <strong>{section.titleAr}</strong>
                  <span className="student-curriculum-section-meta">
                    {progress.completed} / {progress.total} مكتمل
                  </span>
                </div>
                <div className="student-curriculum-section-footer">
                  <div className="student-curriculum-section-bar" aria-hidden>
                    <span style={{ width: `${progress.percent}%` }} />
                  </div>
                  <span className="student-curriculum-section-percent">{progress.percent}%</span>
                  <ChevronDown size={18} className="student-curriculum-chevron" />
                </div>
              </button>

              <div className={`student-curriculum-section-body-wrap ${isExpanded ? 'open' : ''}`}>
                <div className="student-curriculum-section-body">
                  {items.map((item) => {
                  const state = getItemState(item, items);
                  const isActive = state === 'active';
                  const isLocked = state === 'locked';
                  const isDone = state === 'done';
                  const isQuizDisabled = item.type === 'quiz' && !item.quiz?.isReady;

                  return (
                    <button
                      key={item.key}
                      ref={isActive ? activeItemRef : undefined}
                      type="button"
                      className={[
                        'student-curriculum-item',
                        `type-${item.type}`,
                        isActive ? 'active' : '',
                        isDone ? 'done' : '',
                        isLocked || isQuizDisabled ? 'locked' : '',
                      ].filter(Boolean).join(' ')}
                      disabled={isLocked || isQuizDisabled}
                      onClick={() => handleItemClick(item, items)}
                    >
                      <ItemIcon item={item} state={state} />
                      <div className="student-curriculum-item-content">
                        <span className="student-curriculum-item-title">{item.title}</span>
                        {item.meta ? (
                          <span className="student-curriculum-item-meta">{item.meta}</span>
                        ) : null}
                      </div>
                      {item.type === 'lesson' && item.lesson?.duration ? (
                        <span className="student-curriculum-item-duration">
                          {fmtDuration(item.lesson.duration)}
                        </span>
                      ) : null}
                      {item.type === 'quiz' && item.quiz?.isCompleted ? (
                        <span className="student-curriculum-item-duration quiz-score">
                          {item.quiz.lastScore ?? 0}%
                        </span>
                      ) : null}
                    </button>
                  );
                })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
