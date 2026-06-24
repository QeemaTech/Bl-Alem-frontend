import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, ClipboardList, Edit, ExternalLink, FilePlus, GripVertical, Plus, Send, Trash2 } from '@/icons';
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

const courseVariant = (status: string) => {
  if (status === 'PUBLISHED') return 'published' as const;
  if (status === 'PENDING_REVIEW') return 'pending' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  return 'default' as const;
};

export default function InstructorCourseBuilderPage() {
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

  const basePath = `/instructor/courses/${id}`;
  const goSectionNew = () => navigate(`${basePath}/sections/new`);
  const goSectionEdit = (sectionId: number) => navigate(`${basePath}/sections/${sectionId}/edit`);
  const goLessonNew = (sectionId?: number) => navigate(
    `${basePath}/lessons/new${sectionId ? `?sectionId=${sectionId}` : ''}`,
  );
  const goLessonEdit = (lessonId: number) => navigate(`${basePath}/lessons/${lessonId}/edit`);
  const goResourceNew = (lessonId?: number) => navigate(
    lessonId ? `${basePath}/lessons/${lessonId}/resources/new` : `${basePath}/resources/new`,
  );
  const goQuizNew = () => navigate(`${basePath}/quizzes/new`);

  const submitReview = async () => {
    await instructorApi.submitCourseReview(id!);
    setConfirmSubmit(false);
    setSuccessOpen(true);
    load();
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
      <div className="page-grid">
        <PageHeader title="منشئ الكورس" breadcrumb={[{ label: 'كورساتي', to: '/instructor/courses' }, { label: 'غير موجود' }]} />
        <Card><EmptyState title="الكورس غير موجود" description="لم نتمكن من تحميل بيانات الكورس." /></Card>
      </div>
    );
  }

  const lessons = course.sections?.flatMap((s: any) => s.lessons || []) || [];
  const lessonTitleById = (lessonId?: number | null) => {
    if (!lessonId) return 'اختبار للدورة بالكامل';
    return lessons.find((l: any) => l.id === lessonId)?.titleAr || 'درس مرتبط';
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

  return (
    <div className="page-grid">
      <PageHeader
        title={course.titleAr}
        subtitle="اسحب أيقونة ⋮⋮ لترتيب الدروس داخل السيشن"
        breadcrumb={[{ label: 'كورساتي', to: '/instructor/courses' }, { label: course.titleAr }]}
        action={
          <div className="chip-row">
            <Button type="button" size="sm" onClick={goSectionNew} icon={<Plus size={16} />}>إضافة سيشن</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => goLessonNew()} icon={<Plus size={16} />}>إضافة درس</Button>
            <Button type="button" size="sm" variant="secondary" onClick={goQuizNew} icon={<Plus size={16} />}>إضافة اختبار</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => goResourceNew()} icon={<FilePlus size={16} />}>مورد</Button>
            <Button type="button" size="sm" onClick={() => setConfirmSubmit(true)} icon={<Send size={16} />}>إرسال للمراجعة</Button>
          </div>
        }
      />

      <Card>
        <Badge variant={courseVariant(course.status)}>{course.status}</Badge>
      </Card>

      {course.sections?.length ? (
        course.sections.map((section: any, sectionIndex: number) => {
          const sectionOpen = isSectionOpen(section.id);
          const lessonCount = sortedLessons(section).length;
          return (
          <Card key={section.id} className="builder-section-card">
            <div className="section-heading builder-section-heading">
              <button
                type="button"
                className="builder-section-toggle"
                onClick={() => toggleSection(section.id)}
                aria-expanded={sectionOpen}
              >
                <ChevronDown size={20} className={`builder-section-chevron ${sectionOpen ? 'open' : ''}`} />
                <div className="builder-section-title-wrap">
                  <h3>{section.titleAr}</h3>
                  <span className="builder-section-meta">{lessonCount} {lessonCount === 1 ? 'درس' : 'دروس'}</span>
                </div>
              </button>
              <div className="chip-row">
                <Button variant="ghost" size="sm" onClick={() => moveSection(section.id, 'up')} disabled={sectionIndex === 0} icon={<ChevronUp size={16} />} />
                <Button variant="ghost" size="sm" onClick={() => moveSection(section.id, 'down')} disabled={sectionIndex === course.sections.length - 1} icon={<ChevronDown size={16} />} />
                <Button variant="secondary" size="sm" onClick={() => goSectionEdit(section.id)} icon={<Edit size={14} />}>تعديل</Button>
                <Button variant="secondary" size="sm" onClick={() => goLessonNew(section.id)} icon={<Plus size={14} />}>درس</Button>
                <Button variant="danger" size="sm" onClick={async () => { await instructorApi.deleteSection(section.id); load(); }} icon={<Trash2 size={15} />}>
                  حذف
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
                      title="اسحب لإعادة الترتيب"
                      onDragStart={(e) => {
                        startLessonDrag(lesson.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={endLessonDrag}
                    >
                      <GripVertical size={18} />
                    </span>
                    <div className="session-card-info">
                    <h4>{lesson.titleAr}</h4>
                    <p>فيديو ({Math.round((lesson.duration || 0) / 60)} دقيقة)</p>
                    {lesson.resources?.length ? (
                      <div className="lesson-resources">
                        {lesson.resources.map((resource: any) => (
                          <div key={resource.id} className="lesson-resource-item">
                            <a href={resource.fileUrl} target="_blank" rel="noreferrer">{resource.title}</a>
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
                    {lesson.isPreview ? 'معاينة' : lesson.isLocked ? 'مغلق' : 'مفتوح'}
                  </Badge>
                  <div className="chip-row">
                    <Button variant="ghost" size="sm" onClick={() => moveLesson(lesson, 'up')} disabled={lessonIndex === 0} icon={<ChevronUp size={14} />} />
                    <Button variant="ghost" size="sm" onClick={() => moveLesson(lesson, 'down')} disabled={lessonIndex === sortedLessons(section).length - 1} icon={<ChevronDown size={14} />} />
                    <Button variant="secondary" size="sm" onClick={() => goLessonEdit(lesson.id)} icon={<Edit size={14} />}>تعديل</Button>
                    <Button variant="ghost" size="sm" onClick={() => goResourceNew(lesson.id)} icon={<FilePlus size={14} />} />
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
                <EmptyState title="لا توجد دروس" description="أضف دروساً لهذا القسم أو اسحب درساً هنا." />
                <Button size="sm" onClick={() => goLessonNew(section.id)} icon={<Plus size={14} />}>إضافة درس</Button>
              </div>
            )}
            </div>
            ) : null}
          </Card>
          );
        })
      ) : (
        <Card>
          <EmptyState title="لا توجد أقسام" description="ابدأ بإضافة قسم ثم دروس." />
          <Button onClick={goSectionNew} icon={<Plus size={16} />}>إضافة سيشن</Button>
        </Card>
      )}

      <Card>
        <div className="section-heading">
          <h2>الاختبارات</h2>
          <Button type="button" size="sm" variant="secondary" onClick={goQuizNew} icon={<Plus size={16} />}>
            إضافة اختبار
          </Button>
        </div>
        {course.quizzes?.length ? (
          course.quizzes.map((q: any) => {
            const readyCount = quizReadyCount(q);
            return (
              <div key={q.id} className="session-card quiz-card">
                <ClipboardList size={22} color="var(--primary)" />
                <div className="session-card-info">
                  <h4>{q.titleAr}</h4>
                  <p>
                    {readyCount} سؤال جاهز · {q.durationMinutes || 10} دقيقة · نجاح {q.passingScore || 60}%
                    · {lessonTitleById(q.lessonId)}
                  </p>
                </div>
                <Badge variant={readyCount > 0 ? 'success' : 'warning'}>
                  {readyCount > 0 ? 'جاهز للطلاب' : 'غير جاهز'}
                </Badge>
                <div className="chip-row">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => navigate(`/instructor/quizzes/${q.id}`)}
                    icon={<ExternalLink size={14} />}
                  >
                    فتح منشئ الاختبار
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (!window.confirm(`حذف الاختبار "${q.titleAr}"؟`)) return;
                      await instructorApi.deleteQuiz(q.id);
                      showToast('تم حذف الاختبار.', 'success');
                      load();
                    }}
                    icon={<Trash2 size={14} />}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState title="لا توجد اختبارات" description="أنشئ اختباراً مرتبطاً بالدورة أو بدرس محدد." />
        )}
      </Card>

      <ConfirmDialog
        isOpen={confirmSubmit}
        title="إرسال للمراجعة"
        message="سيصبح الكورس قيد مراجعة الإدارة ولن يتم نشره مباشرة."
        variant="primary"
        onConfirm={submitReview}
        onCancel={() => setConfirmSubmit(false)}
      />

      <SuccessModal
        isOpen={successOpen}
        title="تم إرسال للمراجعة بنجاح"
        message="وسوف يتم التواصل معك في أقرب وقت بعد مراجعة المحتوى."
        actionLabel="العودة للرئيسية"
        onAction={() => { setSuccessOpen(false); navigate('/instructor/dashboard'); }}
      />
    </div>
  );
}
