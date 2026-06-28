import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronDown, ChevronUp, ClipboardList, Edit, FilePlus, GripVertical, Layers,
  PlayCircle, Plus, Send, Trash2,
} from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { useToast } from '../../components/ui/Toast';
import {
  localizedCourseTitle,
  localizedLessonTitle,
  localizedQuizTitle,
  localizedResourceTitle,
  localizedSectionTitle,
} from '../../utils/localizedContent';

const courseVariant = (status: string) => {
  if (status === 'PUBLISHED') return 'published' as const;
  if (status === 'PENDING_REVIEW') return 'pending' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  return 'default' as const;
};

export default function InstructorCourseBuilderPage() {
  const { t, i18n } = useTranslation('courses');
  const lang = i18n.language;
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [dragLessonId, setDragLessonId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | 'end' | null>(null);
  const [dropSectionId, setDropSectionId] = useState<number | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());

  const load = () => {
    if (!id) return;
    setLoading(true);
    instructorApi.course(id).then(setCourse).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const coursePath = `/instructor/courses/${id}`;
  const goSectionNew = () => navigate(`${coursePath}/sections/new`);
  const goSectionEdit = (sectionId: number) => navigate(`${coursePath}/sections/${sectionId}/edit`);
  const goLessonNew = (sectionId?: number) => navigate(
    `${coursePath}/lessons/new${sectionId ? `?sectionId=${sectionId}` : ''}`,
  );
  const goLessonEdit = (lessonId: number) => navigate(`${coursePath}/lessons/${lessonId}/edit`);
  const goResourceNew = (lessonId?: number) => navigate(
    lessonId ? `${coursePath}/lessons/${lessonId}/resources/new` : `${coursePath}/resources/new`,
  );
  const goQuizNew = () => navigate(`${coursePath}/quizzes/new`);

  const handleAddLesson = () => {
    const sections = course?.sections || [];
    if (!sections.length) {
      showToast(t('builder.needSessionFirst'), 'warning');
      goSectionNew();
      return;
    }
    if (sections.length === 1) {
      goLessonNew(sections[0].id);
      return;
    }
    goLessonNew();
  };

  const submitReview = async () => {
    try {
      await instructorApi.submitCourseReview(id!);
      setConfirmSubmit(false);
      setSuccessOpen(true);
      load();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('toast.submitFailed');
      showToast(message, 'error');
    }
  };

  const moveSection = async (sectionId: number, direction: 'up' | 'down') => {
    const sections = [...(course.sections || [])].sort((a: any, b: any) => a.order - b.order);
    const index = sections.findIndex((s: any) => s.id === sectionId);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sections.length) return;
    [sections[index], sections[swapIndex]] = [sections[swapIndex], sections[index]];
    await instructorApi.reorderSections(id!, sections.map((s: any, i: number) => ({ id: s.id, order: i + 1 })));
    load();
  };

  const moveLesson = async (lesson: any, direction: 'up' | 'down') => {
    const section = course.sections?.find((s: any) => s.id === lesson.sectionId);
    if (!section) return;
    const lessons = [...(section.lessons || [])].sort((a: any, b: any) => a.order - b.order);
    const index = lessons.findIndex((l: any) => l.id === lesson.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= lessons.length) return;
    [lessons[index], lessons[swapIndex]] = [lessons[swapIndex], lessons[index]];
    await instructorApi.reorderLessons(id!, lessons.map((l: any, i: number) => ({ id: l.id, order: i + 1, sectionId: section.id })));
    load();
  };

  const handleLessonDrop = async (targetLesson: any, targetSectionId: number) => {
    if (!dragLessonId) return;
    if (targetLesson && dragLessonId === targetLesson.id) return;

    const draggedSection = course.sections?.find((s: any) =>
      (s.lessons || []).some((l: any) => l.id === dragLessonId));
    const targetSection = course.sections?.find((s: any) => s.id === targetSectionId);
    if (!draggedSection || !targetSection) return;

    const sortLessons = (items: any[]) => [...items].sort((a, b) => a.order - b.order);
    let targetLessons = sortLessons(targetSection.lessons || []).filter((l: any) => l.id !== dragLessonId);

    if (targetLesson) {
      const targetIndex = targetLessons.findIndex((l: any) => l.id === targetLesson.id);
      targetLessons.splice(targetIndex, 0, { id: dragLessonId, sectionId: targetSection.id });
    } else {
      targetLessons.push({ id: dragLessonId, sectionId: targetSection.id });
    }

    const payload = targetLessons.map((l: any, i: number) => ({
      id: l.id,
      order: i + 1,
      sectionId: targetSection.id,
    }));

    if (draggedSection.id !== targetSection.id) {
      const sourceLessons = sortLessons(draggedSection.lessons || [])
        .filter((l: any) => l.id !== dragLessonId)
        .map((l: any, i: number) => ({ id: l.id, order: i + 1, sectionId: draggedSection.id }));
      payload.push(...sourceLessons);
    }

    await instructorApi.reorderLessons(id!, payload);
    setDragLessonId(null);
    setDropTargetId(null);
    setDropSectionId(null);
    load();
  };

  const startLessonDrag = (lessonId: number) => setDragLessonId(lessonId);

  const endLessonDrag = () => {
    setDragLessonId(null);
    setDropTargetId(null);
    setDropSectionId(null);
  };

  const sortedLessons = (section: any) =>
    [...(section.lessons || [])].sort((a: any, b: any) => a.order - b.order);

  const isSectionOpen = (sectionId: number) => !collapsedSections.has(sectionId);

  const toggleSection = (sectionId: number) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  if (loading) return <DashboardSkeleton />;
  if (!course) {
    return (
      <div className="page-grid instructor-course-builder-page">
        <PageHeader
          title={t('builder.title')}
          breadcrumb={[
            { label: t('management.title'), to: '/instructor/courses' },
            { label: t('builder.missing') },
          ]}
        />
        <Card>
          <EmptyState title={t('builder.notFound')} description={t('builder.notFoundDesc')} />
        </Card>
      </div>
    );
  }

  const lessons = course.sections?.flatMap((s: any) => s.lessons || []) || [];
  const courseTitle = localizedCourseTitle(course, lang);

  const lessonTitleById = (lessonId?: number | null) => {
    if (!lessonId) return t('builder.fullCourseQuiz');
    const lesson = lessons.find((l: any) => l.id === lessonId);
    return lesson ? localizedLessonTitle(lesson, lang) : t('builder.linkedLesson');
  };

  const quizReadyCount = (quiz: any) => (
    (quiz.questions || []).filter((question: any) => {
      const answers = (question.answers || []).filter((answer: any) => answer.textAr?.trim());
      const correct = answers.filter((answer: any) => answer.isCorrect).length;
      if (correct !== 1) return false;
      if (question.type === 'TRUE_FALSE') return answers.length === 2;
      return answers.length >= 2;
    }).length
  );

  const statusLabel = (status: string) => t(`builder.status.${status}`, { defaultValue: status });

  return (
    <div className="page-grid instructor-course-builder-page">
      <PageHeader
        title={courseTitle}
        subtitle={t('builder.subtitle')}
        breadcrumb={[
          { label: t('management.title'), to: '/instructor/courses' },
          { label: courseTitle },
        ]}
        status={(
          <Badge variant={courseVariant(course.status)}>
            {statusLabel(course.status)}
          </Badge>
        )}
      />

      <Card className="instructor-builder-toolbar">
        <div className="instructor-builder-toolbar-main">
          <span className="instructor-builder-toolbar-label">{t('builder.addContent')}</span>
          <div className="instructor-builder-toolbar-actions">
            <Button type="button" onClick={goSectionNew} icon={<Layers size={18} />}>
              {t('builder.addSession')}
            </Button>
            <Button type="button" variant="outline" onClick={handleAddLesson} icon={<PlayCircle size={18} />}>
              {t('builder.addLesson')}
            </Button>
            <Button type="button" variant="outline" onClick={goQuizNew} icon={<ClipboardList size={18} />}>
              {t('builder.addQuiz')}
            </Button>
            <Button type="button" variant="outline" onClick={() => goResourceNew()} icon={<FilePlus size={18} />}>
              {t('builder.resource')}
            </Button>
          </div>
        </div>
        <Button type="button" onClick={() => setConfirmSubmit(true)} icon={<Send size={18} />}>
          {t('builder.submitReview')}
        </Button>
      </Card>

      <div className="instructor-builder-sections-block">
        <div className="instructor-builder-sections-head">
          <h2>{t('builder.sessionsTitle')}</h2>
          {course.sections?.length ? (
            <Button type="button" size="sm" variant="outline" onClick={goSectionNew} icon={<Plus size={16} />}>
              {t('builder.newSession')}
            </Button>
          ) : null}
        </div>

        {course.sections?.length ? (
          course.sections.map((section: any, sectionIndex: number) => {
            const sectionOpen = isSectionOpen(section.id);
            const lessonCount = sortedLessons(section).length;
            return (
              <Card key={section.id} className="builder-section-card">
                <div className="builder-section-heading">
                  <button
                    type="button"
                    className="builder-section-toggle"
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={sectionOpen}
                  >
                    <ChevronDown size={20} className={`builder-section-chevron ${sectionOpen ? 'open' : ''}`} />
                    <div className="builder-section-title-wrap">
                      <h3>{localizedSectionTitle(section, lang)}</h3>
                      <span className="builder-section-meta">
                        {t('builder.lessonCount', { count: lessonCount })}
                      </span>
                    </div>
                  </button>
                  <div className="builder-section-actions">
                    <Button variant="ghost" size="sm" onClick={() => moveSection(section.id, 'up')} disabled={sectionIndex === 0} icon={<ChevronUp size={16} />} aria-label={t('builder.moveUp')} />
                    <Button variant="ghost" size="sm" onClick={() => moveSection(section.id, 'down')} disabled={sectionIndex === course.sections.length - 1} icon={<ChevronDown size={16} />} aria-label={t('builder.moveDown')} />
                    <Button variant="outline" size="sm" onClick={() => goSectionEdit(section.id)} icon={<Edit size={16} />}>{t('builder.edit')}</Button>
                    <Button variant="outline" size="sm" onClick={() => goLessonNew(section.id)} icon={<PlayCircle size={16} />}>{t('builder.lesson')}</Button>
                    <Button variant="danger" size="sm" onClick={async () => { await instructorApi.deleteSection(section.id); load(); }} icon={<Trash2 size={16} />}>
                      {t('builder.delete')}
                    </Button>
                  </div>
                </div>
                {sectionOpen ? (
                  <div className="builder-section-body">
                    {lessonCount ? (
                      <>
                        {sortedLessons(section).map((lesson: any, lessonIndex: number) => (
                          <div
                            key={lesson.id}
                            className={`session-card draggable-item ${dragLessonId === lesson.id ? 'dragging' : ''} ${dropTargetId === lesson.id ? 'drop-target' : ''}`}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDropTargetId(lesson.id);
                              setDropSectionId(section.id);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleLessonDrop(lesson, section.id);
                            }}
                          >
                            <span
                              className="lesson-drag-handle"
                              draggable
                              title={t('builder.dragToReorder')}
                              onDragStart={(e) => {
                                startLessonDrag(lesson.id);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragEnd={endLessonDrag}
                            >
                              <GripVertical size={18} />
                            </span>
                            <div className="session-card-info">
                              <h4>{localizedLessonTitle(lesson, lang)}</h4>
                              <p>{t('builder.videoDuration', { minutes: Math.round((lesson.duration || 0) / 60) })}</p>
                              {lesson.resources?.length ? (
                                <div className="lesson-resources">
                                  {lesson.resources.map((resource: any) => (
                                    <div key={resource.id} className="lesson-resource-item">
                                      <a href={resource.fileUrl} target="_blank" rel="noreferrer">{localizedResourceTitle(resource, lang)}</a>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={async () => { await instructorApi.deleteResource(resource.id); load(); }}
                                        icon={<Trash2 size={12} />}
                                      />
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            <Badge variant={lesson.isPreview ? 'info' : lesson.isLocked ? 'warning' : 'success'}>
                              {lesson.isPreview ? t('builder.preview') : lesson.isLocked ? t('builder.locked') : t('builder.open')}
                            </Badge>
                            <div className="builder-section-actions">
                              <Button variant="ghost" size="sm" onClick={() => moveLesson(lesson, 'up')} disabled={lessonIndex === 0} icon={<ChevronUp size={14} />} aria-label={t('builder.moveUp')} />
                              <Button variant="ghost" size="sm" onClick={() => moveLesson(lesson, 'down')} disabled={lessonIndex === sortedLessons(section).length - 1} icon={<ChevronDown size={14} />} aria-label={t('builder.moveDown')} />
                              <Button variant="outline" size="sm" onClick={() => goLessonEdit(lesson.id)} icon={<Edit size={14} />}>{t('builder.edit')}</Button>
                              <Button variant="ghost" size="sm" className="builder-icon-action-btn" onClick={() => goResourceNew(lesson.id)} icon={<FilePlus size={16} />} aria-label={t('builder.addResource')} />
                              <Button variant="danger" size="sm" onClick={async () => { await instructorApi.deleteLesson(lesson.id); load(); }} icon={<Trash2 size={14} />} />
                            </div>
                          </div>
                        ))}
                        <div
                          className={`lesson-list-dropzone ${dropSectionId === section.id && dropTargetId === 'end' ? 'active' : ''}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDropTargetId('end');
                            setDropSectionId(section.id);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleLessonDrop(null, section.id);
                          }}
                        />
                      </>
                    ) : (
                      <div
                        className={`lesson-list-dropzone ${dropSectionId === section.id ? 'active' : ''}`}
                        onDragOver={(e) => {
                          if (!dragLessonId) return;
                          e.preventDefault();
                          setDropTargetId('end');
                          setDropSectionId(section.id);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleLessonDrop(null, section.id);
                        }}
                      >
                        <EmptyState title={t('builder.noLessonsTitle')} description={t('builder.noLessonsDesc')} />
                        <div className="instructor-builder-empty-actions">
                          <Button size="sm" className="builder-add-lesson-btn" onClick={() => goLessonNew(section.id)} icon={<PlayCircle size={18} />}>
                            {t('builder.addLesson')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </Card>
            );
          })
        ) : (
          <Card>
            <EmptyState title={t('builder.noSessionsTitle')} description={t('builder.noSessionsDesc')} />
            <div className="instructor-builder-empty-actions">
              <Button onClick={goSectionNew} icon={<Layers size={18} />}>{t('builder.addSession')}</Button>
            </div>
          </Card>
        )}
      </div>

      <Card className="instructor-builder-quizzes-card">
        <div className="section-heading">
          <h2>{t('builder.courseResourcesTitle')}</h2>
          <Button type="button" size="sm" variant="outline" onClick={() => goResourceNew()} icon={<FilePlus size={16} />}>
            {t('builder.addCourseResource')}
          </Button>
        </div>
        {course.courseResources?.length ? (
          course.courseResources.map((resource: any) => (
            <div key={resource.id} className="session-card">
              <FilePlus size={22} className="text-primary shrink-0" />
              <div className="session-card-info">
                <h4>{localizedResourceTitle(resource, lang)}</h4>
                <p>{resource.type || 'file'}</p>
              </div>
              <a href={resource.fileUrl} target="_blank" rel="noreferrer" className="builder-resource-link">
                {t('builder.openResource')}
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => { await instructorApi.deleteCourseResource(resource.id); load(); }}
                icon={<Trash2 size={16} />}
                aria-label={t('builder.delete')}
              />
            </div>
          ))
        ) : (
          <EmptyState title={t('builder.noCourseResourcesTitle')} description={t('builder.noCourseResourcesDesc')} />
        )}
      </Card>

      <Card className="instructor-builder-quizzes-card">
        <div className="section-heading">
          <h2>{t('builder.quizzesTitle')}</h2>
          <Button type="button" size="sm" variant="outline" onClick={goQuizNew} icon={<Plus size={16} />}>
            {t('builder.addQuiz')}
          </Button>
        </div>
        {course.quizzes?.length ? (
          course.quizzes.map((q: any) => {
            const readyCount = quizReadyCount(q);
            const quizTitle = localizedQuizTitle(q, lang);
            return (
              <div key={q.id} className="session-card quiz-card">
                <ClipboardList size={22} className="text-primary shrink-0" />
                <div className="session-card-info">
                  <h4>{quizTitle}</h4>
                  <p>
                    {t('builder.quizMeta', {
                      questions: readyCount,
                      minutes: q.durationMinutes || 10,
                      score: q.passingScore || 60,
                      lesson: lessonTitleById(q.lessonId),
                    })}
                  </p>
                </div>
                <Badge variant={readyCount > 0 ? 'success' : 'warning'}>
                  {readyCount > 0 ? t('builder.quizReady') : t('builder.quizNotReady')}
                </Badge>
                <div className="builder-section-actions">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => navigate(`/instructor/quizzes/${q.id}`)}
                    icon={<ClipboardList size={16} />}
                  >
                    {t('builder.manageQuestions')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (!window.confirm(t('builder.deleteQuizConfirm', { title: quizTitle }))) return;
                      await instructorApi.deleteQuiz(q.id);
                      showToast(t('builder.quizDeleted'), 'success');
                      load();
                    }}
                    icon={<Trash2 size={14} />}
                    aria-label={t('builder.deleteQuiz')}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <>
            <EmptyState title={t('builder.noQuizzesTitle')} description={t('builder.noQuizzesDesc')} />
            <div className="instructor-builder-empty-actions">
              <Button variant="outline" onClick={goQuizNew} icon={<ClipboardList size={18} />}>
                {t('builder.addQuiz')}
              </Button>
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        isOpen={confirmSubmit}
        title={t('builder.submitConfirmTitle')}
        message={t('builder.submitConfirmMessage')}
        variant="primary"
        onConfirm={submitReview}
        onCancel={() => setConfirmSubmit(false)}
      />

      <SuccessModal
        isOpen={successOpen}
        title={t('builder.submitSuccessTitle')}
        message={t('builder.submitSuccessMessage')}
        actionLabel={t('builder.backToDashboard')}
        onAction={() => { setSuccessOpen(false); navigate('/instructor/dashboard'); }}
      />
    </div>
  );
}
