import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Edit, Plus, Save, Trash2, X } from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';

type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

interface AnswerDraft {
  textAr: string;
  isCorrect: boolean;
}

interface QuestionDraft {
  textAr: string;
  type: QuestionType;
  answers: AnswerDraft[];
}

const typeLabels: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'اختيار متعدد',
  TRUE_FALSE: 'صح أو خطأ',
};

const emptyMcqAnswers = (): AnswerDraft[] => ([
  { textAr: '', isCorrect: true },
  { textAr: '', isCorrect: false },
]);

const trueFalseAnswers = (correct: 'صح' | 'خطأ' = 'صح'): AnswerDraft[] => ([
  { textAr: 'صح', isCorrect: correct === 'صح' },
  { textAr: 'خطأ', isCorrect: correct === 'خطأ' },
]);

const initialQuestionDraft = (): QuestionDraft => ({
  textAr: '',
  type: 'MULTIPLE_CHOICE',
  answers: emptyMcqAnswers(),
});

const validateQuestionDraft = (draft: QuestionDraft) => {
  if (!draft.textAr.trim()) return 'أدخل نص السؤال.';
  const filled = draft.answers.filter((a) => a.textAr.trim());
  if (draft.type === 'TRUE_FALSE') {
    if (filled.length !== 2) return 'سؤال صح/خطأ يحتاج خيارين.';
  } else if (filled.length < 2) {
    return 'أضف خيارين على الأقل.';
  }
  const correctCount = filled.filter((a) => a.isCorrect).length;
  if (correctCount !== 1) return 'حدّد إجابة صحيحة واحدة فقط.';
  return null;
};

export default function InstructorQuizBuilderPage() {
  const { quizId } = useParams();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [lessons, setLessons] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'quiz' | 'question'; item?: any } | null>(null);
  const [newQuestion, setNewQuestion] = useState<QuestionDraft>(initialQuestionDraft());
  const [newQuestionError, setNewQuestionError] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<QuestionDraft>(initialQuestionDraft());
  const [editError, setEditError] = useState('');
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const load = async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      const data = await instructorApi.quiz(quizId);
      setQuiz(data);
      if (data?.courseId) {
        const course = await instructorApi.course(data.courseId);
        const allLessons = course.sections?.flatMap((s: any) => s.lessons || []) || [];
        setLessons(allLessons);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [quizId]);

  const sortedQuestions = useMemo(
    () => [...(quiz?.questions || [])].sort((a: any, b: any) => a.order - b.order),
    [quiz?.questions],
  );

  const questionStats = useMemo(() => {
    const questions = quiz?.questions || [];
    const complete = questions.filter((q: any) => {
      const answers = q.answers || [];
      return answers.length >= (q.type === 'TRUE_FALSE' ? 2 : 2)
        && answers.filter((a: any) => a.isCorrect).length === 1;
    });
    return { total: questions.length, complete: complete.length };
  }, [quiz]);

  const updateQuiz = async () => {
    if (!quizId || !quiz) return;
    setSavingQuiz(true);
    try {
      await instructorApi.updateQuiz(quizId, {
        titleAr: quiz.titleAr?.trim(),
        durationMinutes: Number(quiz.durationMinutes || 10),
        passingScore: Number(quiz.passingScore || 60),
        status: quiz.status,
        lessonId: quiz.lessonId ? Number(quiz.lessonId) : null,
      });
      showToast('تم حفظ إعدادات الاختبار.', 'success');
      load();
    } catch {
      showToast('تعذّر حفظ الاختبار.', 'error');
    } finally {
      setSavingQuiz(false);
    }
  };

  const deleteQuiz = async () => {
    if (!quizId) return;
    const courseId = quiz?.courseId;
    await instructorApi.deleteQuiz(quizId);
    showToast('تم حذف الاختبار.', 'success');
    navigate(courseId ? `/instructor/courses/${courseId}/builder` : '/instructor/courses');
  };

  const setCorrectAnswer = (answers: AnswerDraft[], index: number) =>
    answers.map((item, i) => ({ ...item, isCorrect: i === index }));

  const changeNewQuestionType = (type: QuestionType) => {
    setNewQuestion({
      textAr: newQuestion.textAr,
      type,
      answers: type === 'TRUE_FALSE' ? trueFalseAnswers() : emptyMcqAnswers(),
    });
    setNewQuestionError('');
  };

  const changeEditQuestionType = (type: QuestionType) => {
    setEditDraft({
      textAr: editDraft.textAr,
      type,
      answers: type === 'TRUE_FALSE' ? trueFalseAnswers() : emptyMcqAnswers(),
    });
    setEditError('');
  };

  const addNewQuestion = async (e: FormEvent) => {
    e.preventDefault();
    const error = validateQuestionDraft(newQuestion);
    if (error) {
      setNewQuestionError(error);
      return;
    }
    setAddingQuestion(true);
    try {
      await instructorApi.createQuestion(quizId!, {
        textAr: newQuestion.textAr.trim(),
        type: newQuestion.type,
        answers: newQuestion.answers
          .filter((a) => a.textAr.trim())
          .map((a) => ({ textAr: a.textAr.trim(), isCorrect: a.isCorrect })),
      });
      showToast('تمت إضافة السؤال.', 'success');
      setNewQuestion(initialQuestionDraft());
      setNewQuestionError('');
      load();
    } catch {
      showToast('تعذّر إضافة السؤال.', 'error');
    } finally {
      setAddingQuestion(false);
    }
  };

  const startEditQuestion = (question: any) => {
    setEditingQuestionId(question.id);
    setEditDraft({
      textAr: question.textAr || '',
      type: question.type || 'MULTIPLE_CHOICE',
      answers: (question.answers || []).map((a: any) => ({
        textAr: a.textAr,
        isCorrect: Boolean(a.isCorrect),
      })),
    });
    setEditError('');
  };

  const saveEditQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingQuestionId) return;
    const error = validateQuestionDraft(editDraft);
    if (error) {
      setEditError(error);
      return;
    }
    setSavingQuestion(true);
    try {
      await instructorApi.updateQuestion(editingQuestionId, {
        textAr: editDraft.textAr.trim(),
        type: editDraft.type,
        answers: editDraft.answers
          .filter((a) => a.textAr.trim())
          .map((a) => ({ textAr: a.textAr.trim(), isCorrect: a.isCorrect })),
      });
      showToast('تم تحديث السؤال.', 'success');
      setEditingQuestionId(null);
      load();
    } catch {
      showToast('تعذّر تحديث السؤال.', 'error');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'quiz') await deleteQuiz();
    if (deleteTarget.type === 'question' && deleteTarget.item) {
      await instructorApi.deleteQuestion(deleteTarget.item.id);
      showToast('تم حذف السؤال.', 'success');
      if (editingQuestionId === deleteTarget.item.id) setEditingQuestionId(null);
      load();
    }
    setDeleteTarget(null);
  };

  const renderAnswerEditor = (
    draft: QuestionDraft,
    setDraft: (next: QuestionDraft) => void,
    disabled?: boolean,
  ) => {
    if (draft.type === 'TRUE_FALSE') {
      const correctIndex = draft.answers.findIndex((a) => a.isCorrect);
      return (
        <div className="quiz-answer-options">
          {draft.answers.map((answer, index) => (
            <label key={answer.textAr} className={`quiz-answer-option ${answer.isCorrect ? 'correct' : ''}`}>
              <input
                type="radio"
                name={`tf-${disabled ? 'edit' : 'new'}`}
                checked={correctIndex === index}
                disabled={disabled}
                onChange={() => setDraft({ ...draft, answers: setCorrectAnswer(draft.answers, index) })}
              />
              <span>{answer.textAr}</span>
              {answer.isCorrect ? <CheckCircle2 size={16} /> : null}
            </label>
          ))}
        </div>
      );
    }

    return (
      <div className="quiz-answer-list">
        {draft.answers.map((answer, index) => (
          <div key={`${disabled ? 'edit' : 'new'}-answer-${index}`} className="quiz-answer-row">
            <label className="quiz-answer-radio">
              <input
                type="radio"
                name={`mcq-${disabled ? 'edit' : 'new'}`}
                checked={answer.isCorrect}
                disabled={disabled}
                onChange={() => setDraft({ ...draft, answers: setCorrectAnswer(draft.answers, index) })}
              />
            </label>
            <input
              type="text"
              className="quiz-answer-input"
              value={answer.textAr}
              disabled={disabled}
              placeholder={`اكتب نص الخيار ${index + 1}`}
              onChange={(e) => {
                const answers = [...draft.answers];
                answers[index] = { ...answers[index], textAr: e.target.value };
                setDraft({ ...draft, answers });
              }}
            />
            {draft.answers.length > 2 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const answers = draft.answers.filter((_, i) => i !== index);
                  if (!answers.some((a) => a.isCorrect) && answers.length) answers[0].isCorrect = true;
                  setDraft({ ...draft, answers });
                }}
                icon={<Trash2 size={14} />}
              />
            ) : null}
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setDraft({
            ...draft,
            answers: [...draft.answers, { textAr: '', isCorrect: false }],
          })}
        >
          إضافة خيار
        </Button>
      </div>
    );
  };

  if (loading) return <LoadingSkeleton variant="block" count={2} />;
  if (!quiz) {
    return (
      <div className="page-grid">
        <PageHeader title="منشئ الاختبار" breadcrumb={[{ label: 'كورساتي', to: '/instructor/courses' }, { label: 'غير موجود' }]} />
        <Card><EmptyState title="الاختبار غير موجود" description="لم نتمكن من تحميل بيانات الاختبار." /></Card>
      </div>
    );
  }

  const builderUrl = quiz.courseId ? `/instructor/courses/${quiz.courseId}/builder` : '/instructor/courses';

  return (
    <div className="page-grid quiz-builder-page">
      <div className="reports-header quiz-builder-header">
        <PageHeader
          title={quiz.titleAr || 'منشئ الاختبار'}
          subtitle={`${questionStats.complete} من ${questionStats.total} أسئلة جاهزة${quiz.isReady ? '' : ' — أكمل الأسئلة لتفعيل الاختبار للطلاب'}`}
          breadcrumb={[
            { label: 'كورساتي', to: '/instructor/courses' },
            { label: quiz.course?.titleAr || 'الكورس', to: builderUrl },
            { label: quiz.titleAr || 'الاختبار' },
          ]}
        />
        <div className="quiz-builder-header-actions">
          <div className="quiz-builder-header-actions-main">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(builderUrl)}
              icon={<ArrowRight size={18} />}
            >
              العودة لمنشئ الكورس
            </Button>
            <Button type="button" loading={savingQuiz} onClick={updateQuiz} icon={<Save size={18} />}>
              حفظ الإعدادات
            </Button>
          </div>
          <Button
            type="button"
            variant="danger"
            onClick={() => setDeleteTarget({ type: 'quiz' })}
            icon={<Trash2 size={18} />}
          >
            حذف الاختبار
          </Button>
        </div>
      </div>

      <Card className="quiz-settings-card">
        <div className="section-heading quiz-section-heading">
          <div>
            <h2 className="course-form-section-title">إعدادات الاختبار</h2>
            <p className="course-form-section-desc">المدة، درجة النجاح، وربط الاختبار بدرس أو بالدورة كاملة.</p>
          </div>
          <Badge variant={quiz.isReady ? 'success' : 'warning'}>
            {quiz.isReady ? 'جاهز للطلاب' : 'غير جاهز'}
          </Badge>
        </div>
        <div className="quiz-settings-grid">
          <Input label="العنوان" value={quiz.titleAr || ''} onChange={(e) => setQuiz({ ...quiz, titleAr: e.target.value })} />
          <Input label="المدة (دقيقة)" type="number" min={1} value={quiz.durationMinutes ?? ''} onChange={(e) => setQuiz({ ...quiz, durationMinutes: e.target.value })} />
          <Input label="درجة النجاح (%)" type="number" min={1} max={100} value={quiz.passingScore ?? ''} onChange={(e) => setQuiz({ ...quiz, passingScore: e.target.value })} />
          <Select
            label="الحالة"
            value={quiz.status || 'ACTIVE'}
            onChange={(e) => setQuiz({ ...quiz, status: e.target.value })}
            options={[
              { label: 'فعّال', value: 'ACTIVE' },
              { label: 'غير فعّال', value: 'INACTIVE' },
            ]}
          />
          <Select
            label="ربط بدرس"
            value={quiz.lessonId ? String(quiz.lessonId) : ''}
            onChange={(e) => setQuiz({ ...quiz, lessonId: e.target.value })}
            options={[
              { label: 'اختبار للدورة بالكامل', value: '' },
              ...lessons.map((lesson: any) => ({ label: lesson.titleAr, value: String(lesson.id) })),
            ]}
          />
        </div>
      </Card>

      <section className="quiz-questions-section">
        <div className="quiz-section-intro">
          <h2>الأسئلة ({sortedQuestions.length})</h2>
          <p>السؤال الأحدث يظهر في الأعلى. يمكنك تعديله أو حذفه من هنا.</p>
        </div>

        {sortedQuestions.length ? (
          <div className="quiz-questions-list">
            {sortedQuestions.map((q: any, index: number) => (
              <Card key={q.id} className="quiz-question-card">
                {editingQuestionId === q.id ? (
                  <form className="quiz-question-edit-form" onSubmit={saveEditQuestion}>
                    <div className="section-heading quiz-section-heading">
                      <h3>تعديل السؤال {index + 1}</h3>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingQuestionId(null)} icon={<X size={14} />}>
                        إلغاء
                      </Button>
                    </div>
                    <Textarea
                      label="نص السؤال"
                      value={editDraft.textAr}
                      onChange={(e) => setEditDraft({ ...editDraft, textAr: e.target.value })}
                      rows={3}
                    />
                    <Select
                      label="نوع السؤال"
                      value={editDraft.type}
                      onChange={(e) => changeEditQuestionType(e.target.value as QuestionType)}
                      options={[
                        { label: 'اختيار متعدد', value: 'MULTIPLE_CHOICE' },
                        { label: 'صح أو خطأ', value: 'TRUE_FALSE' },
                      ]}
                    />
                    <div className="quiz-answers-panel">
                      <span className="quiz-answers-panel-title">الإجابات</span>
                      {renderAnswerEditor(editDraft, setEditDraft)}
                    </div>
                    {editError ? <p className="field-error">{editError}</p> : null}
                    <div className="chip-row quiz-question-actions">
                      <Button type="submit" loading={savingQuestion} icon={<Save size={14} />}>حفظ التعديلات</Button>
                      <Button type="button" variant="ghost" onClick={() => setEditingQuestionId(null)}>إلغاء</Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="section-heading quiz-section-heading">
                      <div className="quiz-question-head">
                        <span className="quiz-question-index">سؤال {index + 1}</span>
                        <h3>{q.textAr}</h3>
                      </div>
                      <Badge variant="info">{typeLabels[q.type as QuestionType] || q.type}</Badge>
                    </div>
                    <div className="quiz-answer-preview">
                      {(q.answers || []).map((a: any) => (
                        <div key={a.id} className={`quiz-answer-preview-item ${a.isCorrect ? 'correct' : ''}`}>
                          {a.isCorrect ? <CheckCircle2 size={16} /> : <span className="quiz-answer-dot" />}
                          <span>{a.textAr}</span>
                        </div>
                      ))}
                    </div>
                    <div className="chip-row quiz-question-actions">
                      <Button type="button" size="sm" variant="secondary" onClick={() => startEditQuestion(q)} icon={<Edit size={14} />}>
                        تعديل السؤال
                      </Button>
                      <Button type="button" size="sm" variant="danger" onClick={() => setDeleteTarget({ type: 'question', item: q })} icon={<Trash2 size={14} />}>
                        حذف
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="quiz-empty-questions-card">
            <EmptyState title="لا توجد أسئلة بعد" description="استخدم النموذج أدناه لإضافة أول سؤال." />
          </Card>
        )}
      </section>

      <Card className="quiz-new-question-card">
        <h2 className="course-form-section-title">إضافة سؤال جديد</h2>
        <p className="course-form-section-desc">السؤال الجديد يظهر في أعلى القائمة مباشرة بعد الإضافة.</p>
        <form className="quiz-new-question-form" onSubmit={addNewQuestion}>
          <Textarea
            label="نص السؤال"
            value={newQuestion.textAr}
            onChange={(e) => setNewQuestion({ ...newQuestion, textAr: e.target.value })}
            placeholder="مثال: ما هي عاصمة المملكة العربية السعودية؟"
            rows={3}
          />
          <Select
            label="نوع السؤال"
            value={newQuestion.type}
            onChange={(e) => changeNewQuestionType(e.target.value as QuestionType)}
            options={[
              { label: 'اختيار متعدد', value: 'MULTIPLE_CHOICE' },
              { label: 'صح أو خطأ', value: 'TRUE_FALSE' },
            ]}
          />
          <div className="quiz-answers-panel">
            <span className="quiz-answers-panel-title">الإجابات</span>
            <small className="field-helper">حدّد الإجابة الصحيحة باختيار الدائرة بجانبها.</small>
            {renderAnswerEditor(newQuestion, setNewQuestion)}
          </div>
          {newQuestionError ? <p className="field-error">{newQuestionError}</p> : null}
          <Button type="submit" loading={addingQuestion} icon={<Plus size={16} />}>
            إضافة السؤال للاختبار
          </Button>
        </form>
      </Card>

      <Card className="quiz-builder-footer">
        <p>بعد إنهاء الأسئلة، احفظ الإعدادات ثم ارجع لمنشئ الكورس لإرسال الدورة للمراجعة.</p>
        <Link to={builderUrl} className="btn btn-secondary">
          العودة لمنشئ الكورس
        </Link>
      </Card>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'quiz' ? 'حذف الاختبار' : 'حذف السؤال'}
        message={deleteTarget?.type === 'quiz' ? 'هل أنت متأكد من حذف الاختبار وجميع أسئلته؟' : 'هل أنت متأكد من حذف هذا السؤال؟'}
        confirmLabel="حذف"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
