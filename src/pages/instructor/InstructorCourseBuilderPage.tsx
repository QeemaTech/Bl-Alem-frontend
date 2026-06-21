import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, ClipboardList, Edit, ExternalLink, FilePlus, GripVertical, Lock, Plus, Send, Trash2, Unlock, Upload } from 'lucide-react';
import { instructorApi } from '../../api/instructor';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { Textarea } from '../../components/ui/Textarea';
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
  const [modal, setModal] = useState<'section' | 'editSection' | 'lesson' | 'editLesson' | 'resource' | 'quiz' | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmOpenQuiz, setConfirmOpenQuiz] = useState<{ id: number; title: string } | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [dragLessonId, setDragLessonId] = useState<number | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingResource, setUploadingResource] = useState(false);
  const lessonVideoInputRef = useRef<HTMLInputElement>(null);
  const resourceFileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    instructorApi.course(id).then(setCourse).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const update = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const close = () => { setModal(null); setForm({}); };

  const saveSection = async (e: FormEvent) => {
    e.preventDefault();
    await instructorApi.createSection(id!, { titleAr: form.titleAr });
    showToast('تم إضافة القسم.', 'success');
    close();
    load();
  };

  const saveEditSection = async (e: FormEvent) => {
    e.preventDefault();
    await instructorApi.updateSection(form.id, { titleAr: form.titleAr });
    showToast('تم تحديث القسم.', 'success');
    close();
    load();
  };

  const saveLesson = async (e: FormEvent) => {
    e.preventDefault();
    await instructorApi.createLesson(id!, {
      ...form,
      sectionId: Number(form.sectionId),
      duration: Number(form.duration || 0),
      isPreview: Boolean(form.isPreview),
      isLocked: form.isLocked !== false,
    });
    showToast('تم إضافة الدرس.', 'success');
    close();
    load();
  };

  const saveEditLesson = async (e: FormEvent) => {
    e.preventDefault();
    await instructorApi.updateLesson(form.id, {
      titleAr: form.titleAr,
      descriptionAr: form.descriptionAr,
      videoUrl: form.videoUrl,
      duration: Number(form.duration || 0),
      isPreview: Boolean(form.isPreview),
      isLocked: Boolean(form.isLocked),
      sectionId: Number(form.sectionId),
    });
    showToast('تم تحديث الدرس.', 'success');
    close();
    load();
  };

  const uploadLessonVideo = async (file: File) => {
    setUploadingVideo(true);
    try {
      const uploaded = await instructorApi.upload('video', file);
      update('videoUrl', uploaded.url);
      showToast('تم رفع الفيديو.', 'success');
    } catch {
      showToast('تعذّر رفع الفيديو.', 'error');
    } finally {
      setUploadingVideo(false);
    }
  };

  const saveResource = async (e: FormEvent) => {
    e.preventDefault();
    await instructorApi.createResource(form.lessonId, { title: form.title, fileUrl: form.fileUrl, type: form.type });
    showToast('تم إضافة المورد.', 'success');
    close();
    load();
  };

  const uploadResourceFile = async (file: File) => {
    setUploadingResource(true);
    try {
      const uploaded = await instructorApi.upload('file', file);
      update('fileUrl', uploaded.url);
      showToast('تم رفع الملف.', 'success');
    } catch {
      showToast('تعذّر رفع الملف.', 'error');
    } finally {
      setUploadingResource(false);
    }
  };

  const saveQuiz = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        titleAr: form.titleAr?.trim(),
        lessonId: form.lessonId || null,
        durationMinutes: Number(form.durationMinutes || 10),
        passingScore: Number(form.passingScore || 60),
      };
      const quiz = await instructorApi.createQuiz(id!, payload);
      showToast('تم إنشاء الاختبار.', 'success');
      close();
      await instructorApi.course(id!).then(setCourse);
      setConfirmOpenQuiz({ id: quiz.id, title: quiz.titleAr || form.titleAr });
    } catch {
      showToast('تعذّر إنشاء الاختبار.', 'error');
    }
  };

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

  const handleLessonDrop = async (targetLesson: any) => {
    if (!dragLessonId || dragLessonId === targetLesson.id) return;
    const allLessons: any[] = [];
    course.sections?.forEach((s: any) => {
      (s.lessons || []).forEach((l: any) => allLessons.push({ ...l, sectionId: s.id }));
    });
    const dragged = allLessons.find((l) => l.id === dragLessonId);
    if (!dragged) return;
    const targetSection = course.sections?.find((s: any) => s.id === targetLesson.sectionId);
    const sectionLessons = [...(targetSection?.lessons || [])].sort((a: any, b: any) => a.order - b.order);
    const filtered = sectionLessons.filter((l: any) => l.id !== dragLessonId);
    const targetIndex = filtered.findIndex((l: any) => l.id === targetLesson.id);
    filtered.splice(targetIndex, 0, { ...dragged, sectionId: targetSection.id });
    await instructorApi.reorderLessons(
      id!,
      filtered.map((l: any, i: number) => ({ id: l.id, order: i + 1, sectionId: targetSection.id }))
    );
    setDragLessonId(null);
    load();
  };

  const openEditSection = (section: any) => {
    setForm({ id: section.id, titleAr: section.titleAr });
    setModal('editSection');
  };

  const openEditLesson = (lesson: any) => {
    setForm({
      id: lesson.id,
      sectionId: String(lesson.sectionId),
      titleAr: lesson.titleAr,
      descriptionAr: lesson.descriptionAr || '',
      videoUrl: lesson.videoUrl || '',
      duration: lesson.duration || 0,
      isPreview: lesson.isPreview,
      isLocked: lesson.isLocked,
    });
    setModal('editLesson');
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

  const quizReadyCount = (quiz: any) => {
    return (quiz.questions || []).filter((question: any) => {
      const answers = (question.answers || []).filter((answer: any) => answer.textAr?.trim());
      const correct = answers.filter((answer: any) => answer.isCorrect).length;
      if (correct !== 1) return false;
      if (question.type === 'TRUE_FALSE') return answers.length === 2;
      return answers.length >= 2;
    }).length;
  };

  return (
    <div className="page-grid">
      <PageHeader
        title={course.titleAr}
        subtitle="رتب السيشنات بالسحب وأضف محتوى جديد"
        breadcrumb={[{ label: 'كورساتي', to: '/instructor/courses' }, { label: course.titleAr }]}
        action={
          <div className="chip-row">
            <Button type="button" size="sm" onClick={() => setModal('section')} icon={<Plus size={16} />}>إضافة سيشن</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setModal('lesson')} icon={<Plus size={16} />}>إضافة درس</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setModal('quiz')} icon={<Plus size={16} />}>إضافة اختبار</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setModal('resource')} icon={<FilePlus size={16} />}>مورد</Button>
            <Button type="button" size="sm" onClick={() => setConfirmSubmit(true)} icon={<Send size={16} />}>إرسال للمراجعة</Button>
          </div>
        }
      />

      <Card>
        <Badge variant={courseVariant(course.status)}>{course.status}</Badge>
      </Card>

      {course.sections?.length ? (
        course.sections.map((section: any, sectionIndex: number) => (
          <Card key={section.id}>
            <div className="section-heading">
              <h3>{section.titleAr}</h3>
              <div className="chip-row">
                <Button variant="ghost" size="sm" onClick={() => moveSection(section.id, 'up')} disabled={sectionIndex === 0} icon={<ChevronUp size={16} />} />
                <Button variant="ghost" size="sm" onClick={() => moveSection(section.id, 'down')} disabled={sectionIndex === course.sections.length - 1} icon={<ChevronDown size={16} />} />
                <Button variant="secondary" size="sm" onClick={() => openEditSection(section)} icon={<Edit size={14} />}>تعديل</Button>
                <Button variant="danger" size="sm" onClick={async () => { await instructorApi.deleteSection(section.id); load(); }} icon={<Trash2 size={15} />}>
                  حذف
                </Button>
              </div>
            </div>
            {section.lessons?.length ? (
              section.lessons.map((lesson: any, lessonIndex: number) => (
                <div
                  key={lesson.id}
                  className={`session-card draggable-item ${dragLessonId === lesson.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => setDragLessonId(lesson.id)}
                  onDragEnd={() => setDragLessonId(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleLessonDrop(lesson)}
                >
                  <GripVertical size={18} color="var(--muted)" style={{ cursor: 'grab' }} />
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
                    <Button variant="ghost" size="sm" onClick={() => moveLesson(lesson, 'down')} disabled={lessonIndex === section.lessons.length - 1} icon={<ChevronDown size={14} />} />
                    <Button variant="secondary" size="sm" onClick={() => openEditLesson(lesson)} icon={<Edit size={14} />}>تعديل</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setModal('resource'); setForm({ lessonId: lesson.id }); }} icon={<FilePlus size={14} />} />
                    <Button variant="danger" size="sm" onClick={async () => { await instructorApi.deleteLesson(lesson.id); load(); }} icon={<Trash2 size={14} />} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="لا توجد دروس" description="أضف دروساً لهذا القسم." />
            )}
          </Card>
        ))
      ) : (
        <Card><EmptyState title="لا توجد أقسام" description="ابدأ بإضافة قسم ثم دروس." /></Card>
      )}

      <Card>
        <div className="section-heading">
          <h2>الاختبارات</h2>
          <Button type="button" size="sm" variant="secondary" onClick={() => setModal('quiz')} icon={<Plus size={16} />}>
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

      <Modal isOpen={modal === 'section'} title="إضافة قسم" onClose={close}>
        <form className="stack-sm" onSubmit={saveSection}>
          <Input label="عنوان القسم" value={form.titleAr || ''} onChange={(e) => update('titleAr', e.target.value)} required />
          <Button>حفظ</Button>
        </form>
      </Modal>

      <Modal isOpen={modal === 'editSection'} title="تعديل القسم" onClose={close}>
        <form className="stack-sm" onSubmit={saveEditSection}>
          <Input label="عنوان القسم" value={form.titleAr || ''} onChange={(e) => update('titleAr', e.target.value)} required />
          <Button>حفظ التعديلات</Button>
        </form>
      </Modal>

      <Modal isOpen={modal === 'lesson'} title="إضافة درس" onClose={close}>
        <form className="stack-sm" onSubmit={saveLesson}>
          <Select label="القسم" value={form.sectionId || ''} onChange={(e) => update('sectionId', e.target.value)} options={(course.sections || []).map((s: any) => ({ label: s.titleAr, value: String(s.id) }))} />
          <Input label="عنوان الدرس" value={form.titleAr || ''} onChange={(e) => update('titleAr', e.target.value)} required />
          <Textarea label="الوصف" value={form.descriptionAr || ''} onChange={(e) => update('descriptionAr', e.target.value)} />
          <Input label="رابط الفيديو" value={form.videoUrl || ''} onChange={(e) => update('videoUrl', e.target.value)} />
          <label className="field">
            <span>رفع فيديو الدرس</span>
            <input
              ref={lessonVideoInputRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLessonVideo(file);
                e.target.value = '';
              }}
            />
            <Button type="button" variant="secondary" loading={uploadingVideo} icon={<Upload size={14} />} onClick={() => lessonVideoInputRef.current?.click()}>
              رفع الفيديو
            </Button>
          </label>
          <Input label="المدة بالثواني" type="number" value={form.duration || ''} onChange={(e) => update('duration', e.target.value)} />
          <label className="field"><input type="checkbox" checked={Boolean(form.isPreview)} onChange={(e) => update('isPreview', e.target.checked)} /> درس معاينة</label>
          <label className="field"><input type="checkbox" checked={form.isLocked !== false} onChange={(e) => update('isLocked', e.target.checked)} /> مغلق {form.isLocked !== false ? <Lock size={14} /> : <Unlock size={14} />}</label>
          <Button>حفظ الدرس</Button>
        </form>
      </Modal>

      <Modal isOpen={modal === 'editLesson'} title="تعديل الدرس" onClose={close}>
        <form className="stack-sm" onSubmit={saveEditLesson}>
          <Select label="القسم" value={form.sectionId || ''} onChange={(e) => update('sectionId', e.target.value)} options={(course.sections || []).map((s: any) => ({ label: s.titleAr, value: String(s.id) }))} />
          <Input label="عنوان الدرس" value={form.titleAr || ''} onChange={(e) => update('titleAr', e.target.value)} required />
          <Textarea label="الوصف" value={form.descriptionAr || ''} onChange={(e) => update('descriptionAr', e.target.value)} />
          <Input label="رابط الفيديو" value={form.videoUrl || ''} onChange={(e) => update('videoUrl', e.target.value)} />
          <label className="field">
            <span>رفع فيديو الدرس</span>
            <input
              ref={lessonVideoInputRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLessonVideo(file);
                e.target.value = '';
              }}
            />
            <Button type="button" variant="secondary" loading={uploadingVideo} icon={<Upload size={14} />} onClick={() => lessonVideoInputRef.current?.click()}>
              رفع الفيديو
            </Button>
          </label>
          <Input label="المدة بالثواني" type="number" value={form.duration || ''} onChange={(e) => update('duration', e.target.value)} />
          <label className="field"><input type="checkbox" checked={Boolean(form.isPreview)} onChange={(e) => update('isPreview', e.target.checked)} /> درس معاينة</label>
          <label className="field"><input type="checkbox" checked={Boolean(form.isLocked)} onChange={(e) => update('isLocked', e.target.checked)} /> مغلق</label>
          <Button>حفظ التعديلات</Button>
        </form>
      </Modal>

      <Modal isOpen={modal === 'resource'} title="إضافة مورد" onClose={close}>
        <form className="stack-sm" onSubmit={saveResource}>
          <Select label="الدرس" value={form.lessonId || ''} onChange={(e) => update('lessonId', e.target.value)} options={lessons.map((l: any) => ({ label: l.titleAr, value: String(l.id) }))} />
          <Input label="عنوان المورد" value={form.title || ''} onChange={(e) => update('title', e.target.value)} required />
          <Input label="رابط الملف" value={form.fileUrl || ''} onChange={(e) => update('fileUrl', e.target.value)} required />
          <label className="field">
            <span>رفع الملف</span>
            <input
              ref={resourceFileInputRef}
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadResourceFile(file);
                e.target.value = '';
              }}
            />
            <Button type="button" variant="secondary" loading={uploadingResource} icon={<Upload size={14} />} onClick={() => resourceFileInputRef.current?.click()}>
              رفع الملف
            </Button>
          </label>
          <Input label="النوع" value={form.type || 'file'} onChange={(e) => update('type', e.target.value)} />
          <Button>إضافة المورد</Button>
        </form>
      </Modal>

      <Modal isOpen={modal === 'quiz'} title="إضافة اختبار" onClose={close}>
        <form className="stack-sm" onSubmit={saveQuiz}>
          <Input label="عنوان الاختبار" value={form.titleAr || ''} onChange={(e) => update('titleAr', e.target.value)} required />
          <Select label="مرتبط بدرس" value={form.lessonId || ''} onChange={(e) => update('lessonId', e.target.value)} options={[{ label: 'اختبار للدورة', value: '' }, ...lessons.map((l: any) => ({ label: l.titleAr, value: String(l.id) }))]} />
          <Input label="المدة" type="number" value={form.durationMinutes || 10} onChange={(e) => update('durationMinutes', e.target.value)} />
          <Input label="درجة النجاح" type="number" value={form.passingScore || 60} onChange={(e) => update('passingScore', e.target.value)} />
          <Button>إنشاء الاختبار</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmOpenQuiz)}
        title="تم إنشاء الاختبار"
        message={`"${confirmOpenQuiz?.title || 'الاختبار'}" جاهز. هل تريد فتح منشئ الاختبار الآن لإضافة الأسئلة؟`}
        confirmLabel="فتح منشئ الاختبار"
        cancelLabel="البقاء في منشئ الكورس"
        variant="primary"
        onConfirm={() => {
          const quizId = confirmOpenQuiz?.id;
          setConfirmOpenQuiz(null);
          if (quizId) navigate(`/instructor/quizzes/${quizId}`);
        }}
        onCancel={() => setConfirmOpenQuiz(null)}
      />

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
