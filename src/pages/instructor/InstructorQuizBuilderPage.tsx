import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Edit, NavChevronBack, Plus, Save, Trash2, X } from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import {
  localizedCourseTitle,
  localizedLessonTitle,
  localizedQuizTitle,
} from '../../utils/localizedContent';

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

const emptyMcqAnswers = (): AnswerDraft[] => ([
  { textAr: '', isCorrect: true },
  { textAr: '', isCorrect: false },
]);

const trueFalseAnswers = (trueLabel: string, falseLabel: string, correct: 'true' | 'false' = 'true'): AnswerDraft[] => ([
  { textAr: trueLabel, isCorrect: correct === 'true' },
  { textAr: falseLabel, isCorrect: correct === 'false' },
]);

const initialQuestionDraft = (): QuestionDraft => ({
  textAr: '',
  type: 'MULTIPLE_CHOICE',
  answers: emptyMcqAnswers(),
});

export default function InstructorQuizBuilderPage() {
  const { t, i18n } = useTranslation('courses');
  const lang = i18n.language;
  const isLtr = lang.startsWith('en');
  const bilingualRowClass = `course-bilingual-row${isLtr ? ' course-bilingual-row--en-first' : ''}`;
  const BackIcon = isLtr ? NavChevronBack : ArrowRight;
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

  const typeLabels: Record<QuestionType, string> = useMemo(() => ({
    MULTIPLE_CHOICE: t('quizBuilder.typeMcq'),
    TRUE_FALSE: t('quizBuilder.typeTrueFalse'),
  }), [t]);

  const validateQuestionDraft = (draft: QuestionDraft) => {
    if (!draft.textAr.trim()) return t('quizBuilder.validation.questionText');
    const filled = draft.answers.filter((a) => a.textAr.trim());
    if (draft.type === 'TRUE_FALSE') {
      if (filled.length !== 2) return t('quizBuilder.validation.trueFalseOptions');
    } else if (filled.length < 2) {
      return t('quizBuilder.validation.minOptions');
    }
    const correctCount = filled.filter((a) => a.isCorrect).length;
    if (correctCount !== 1) return t('quizBuilder.validation.oneCorrect');
    return null;
  };

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
      return answers.length >= 2 && answers.filter((a: any) => a.isCorrect).length === 1;
    });
    return { total: questions.length, complete: complete.length };
  }, [quiz]);

  const updateQuiz = async () => {
    if (!quizId || !quiz) return;
    setSavingQuiz(true);
    try {
      await instructorApi.updateQuiz(quizId, {
        titleAr: quiz.titleAr?.trim() || quiz.titleEn?.trim(),
        titleEn: quiz.titleEn?.trim() || null,
        durationMinutes: Number(quiz.durationMinutes || 10),
        passingScore: Number(quiz.passingScore || 60),
        status: quiz.status,
        lessonId: quiz.lessonId ? Number(quiz.lessonId) : null,
      });
      showToast(t('quizBuilder.toast.settingsSaved'), 'success');
      load();
    } catch {
      showToast(t('quizBuilder.toast.settingsFailed'), 'error');
    } finally {
      setSavingQuiz(false);
    }
  };

  const deleteQuiz = async () => {
    if (!quizId) return;
    const courseId = quiz?.courseId;
    await instructorApi.deleteQuiz(quizId);
    showToast(t('quizBuilder.toast.quizDeleted'), 'success');
    navigate(courseId ? `/instructor/courses/${courseId}/builder` : '/instructor/courses');
  };

  const setCorrectAnswer = (answers: AnswerDraft[], index: number) =>
    answers.map((item, i) => ({ ...item, isCorrect: i === index }));

  const changeNewQuestionType = (type: QuestionType) => {
    setNewQuestion({
      textAr: newQuestion.textAr,
      type,
      answers: type === 'TRUE_FALSE'
        ? trueFalseAnswers(t('quizBuilder.trueLabel'), t('quizBuilder.falseLabel'))
        : emptyMcqAnswers(),
    });
    setNewQuestionError('');
  };

  const changeEditQuestionType = (type: QuestionType) => {
    setEditDraft({
      textAr: editDraft.textAr,
      type,
      answers: type === 'TRUE_FALSE'
        ? trueFalseAnswers(t('quizBuilder.trueLabel'), t('quizBuilder.falseLabel'))
        : emptyMcqAnswers(),
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
      showToast(t('quizBuilder.toast.questionAdded'), 'success');
      setNewQuestion(initialQuestionDraft());
      setNewQuestionError('');
      load();
    } catch {
      showToast(t('quizBuilder.toast.questionAddFailed'), 'error');
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
      showToast(t('quizBuilder.toast.questionUpdated'), 'success');
      setEditingQuestionId(null);
      load();
    } catch {
      showToast(t('quizBuilder.toast.questionUpdateFailed'), 'error');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'quiz') await deleteQuiz();
    if (deleteTarget.type === 'question' && deleteTarget.item) {
      await instructorApi.deleteQuestion(deleteTarget.item.id);
      showToast(t('quizBuilder.toast.questionDeleted'), 'success');
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
            <label key={`${answer.textAr}-${index}`} className={`quiz-answer-option ${answer.isCorrect ? 'correct' : ''}`}>
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
              placeholder={t('quizBuilder.answerPlaceholder', { index: index + 1 })}
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
          {t('quizBuilder.addOption')}
        </Button>
      </div>
    );
  };

  if (loading) return <LoadingSkeleton variant="block" count={2} />;
  if (!quiz) {
    return (
      <div className="page-grid">
        <PageHeader
          title={t('quizBuilder.title')}
          breadcrumb={[
            { label: t('management.title'), to: '/instructor/courses' },
            { label: t('quizBuilder.missing') },
          ]}
        />
        <Card>
          <EmptyState title={t('quizBuilder.notFound')} description={t('quizBuilder.notFoundDesc')} />
        </Card>
      </div>
    );
  }

  const builderUrl = quiz.courseId ? `/instructor/courses/${quiz.courseId}/builder` : '/instructor/courses';
  const quizTitle = localizedQuizTitle(quiz, lang);
  const courseTitle = localizedCourseTitle(quiz.course, lang) || t('quizBuilder.courseFallback');
  const subtitleSuffix = quiz.isReady ? '' : t('quizBuilder.subtitleIncomplete');

  return (
    <div className="page-grid quiz-builder-page">
      <div className="reports-header quiz-builder-header">
        <PageHeader
          title={quizTitle || t('quizBuilder.title')}
          subtitle={t('quizBuilder.subtitle', {
            complete: questionStats.complete,
            total: questionStats.total,
            suffix: subtitleSuffix,
          })}
          breadcrumb={[
            { label: t('management.title'), to: '/instructor/courses' },
            { label: courseTitle, to: builderUrl },
            { label: quizTitle || t('quizBuilder.quizFallback') },
          ]}
        />
        <div className="quiz-builder-header-actions">
          <div className="quiz-builder-header-actions-main">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(builderUrl)}
              icon={<BackIcon size={18} />}
            >
              {t('quizBuilder.backToBuilder')}
            </Button>
            <Button type="button" loading={savingQuiz} onClick={updateQuiz} icon={<Save size={18} />}>
              {t('quizBuilder.saveSettings')}
            </Button>
          </div>
          <Button
            type="button"
            variant="danger"
            onClick={() => setDeleteTarget({ type: 'quiz' })}
            icon={<Trash2 size={18} />}
          >
            {t('quizBuilder.deleteQuiz')}
          </Button>
        </div>
      </div>

      <Card className="quiz-settings-card">
        <div className="section-heading quiz-section-heading">
          <div>
            <h2 className="course-form-section-title">{t('quizBuilder.settingsTitle')}</h2>
            <p className="course-form-section-desc">{t('quizBuilder.settingsDesc')}</p>
          </div>
          <Badge variant={quiz.isReady ? 'success' : 'warning'}>
            {quiz.isReady ? t('quizBuilder.ready') : t('quizBuilder.notReady')}
          </Badge>
        </div>
        <div className="quiz-settings-grid">
          <div className={bilingualRowClass}>
            <Input
              label={t('quizBuilder.titleAr')}
              value={quiz.titleAr || ''}
              onChange={(e) => setQuiz({ ...quiz, titleAr: e.target.value })}
              placeholder={t('quizBuilder.titleArPlaceholder')}
              dir="rtl"
            />
            <Input
              label={t('quizBuilder.titleEn')}
              value={quiz.titleEn || ''}
              onChange={(e) => setQuiz({ ...quiz, titleEn: e.target.value })}
              placeholder={t('quizBuilder.titleEnPlaceholder')}
              dir="ltr"
            />
          </div>
          <Input label={t('quizBuilder.duration')} type="number" min={1} value={quiz.durationMinutes ?? ''} onChange={(e) => setQuiz({ ...quiz, durationMinutes: e.target.value })} />
          <Input label={t('quizBuilder.passingScore')} type="number" min={1} max={100} value={quiz.passingScore ?? ''} onChange={(e) => setQuiz({ ...quiz, passingScore: e.target.value })} />
          <Select
            label={t('quizBuilder.status')}
            value={quiz.status || 'ACTIVE'}
            onChange={(e) => setQuiz({ ...quiz, status: e.target.value })}
            options={[
              { label: t('quizBuilder.statusActive'), value: 'ACTIVE' },
              { label: t('quizBuilder.statusInactive'), value: 'INACTIVE' },
            ]}
          />
          <Select
            label={t('quizBuilder.linkedLesson')}
            value={quiz.lessonId ? String(quiz.lessonId) : ''}
            onChange={(e) => setQuiz({ ...quiz, lessonId: e.target.value })}
            options={[
              { label: t('quizBuilder.fullCourse'), value: '' },
              ...lessons.map((lesson: any) => ({
                label: localizedLessonTitle(lesson, lang),
                value: String(lesson.id),
              })),
            ]}
          />
        </div>
      </Card>

      <Card className="quiz-new-question-card">
        <h2 className="course-form-section-title">{t('quizBuilder.addQuestionTitle')}</h2>
        <p className="course-form-section-desc">{t('quizBuilder.addQuestionDesc')}</p>
        <form className="quiz-new-question-form" onSubmit={addNewQuestion}>
          <Textarea
            label={t('quizBuilder.questionText')}
            value={newQuestion.textAr}
            onChange={(e) => setNewQuestion({ ...newQuestion, textAr: e.target.value })}
            placeholder={t('quizBuilder.questionTextPlaceholder')}
            rows={3}
          />
          <Select
            label={t('quizBuilder.questionType')}
            value={newQuestion.type}
            onChange={(e) => changeNewQuestionType(e.target.value as QuestionType)}
            options={[
              { label: t('quizBuilder.typeMcq'), value: 'MULTIPLE_CHOICE' },
              { label: t('quizBuilder.typeTrueFalse'), value: 'TRUE_FALSE' },
            ]}
          />
          <div className="quiz-answers-panel">
            <span className="quiz-answers-panel-title">{t('quizBuilder.answers')}</span>
            <small className="field-helper">{t('quizBuilder.answersHelper')}</small>
            {renderAnswerEditor(newQuestion, setNewQuestion)}
          </div>
          {newQuestionError ? <p className="field-error">{newQuestionError}</p> : null}
          <Button type="submit" loading={addingQuestion} icon={<Plus size={16} />}>
            {t('quizBuilder.addQuestionSubmit')}
          </Button>
        </form>
      </Card>

      <section className="quiz-questions-section">
        <div className="quiz-section-intro">
          <h2>{t('quizBuilder.questionsTitle', { count: sortedQuestions.length })}</h2>
          <p>{t('quizBuilder.questionsIntro')}</p>
        </div>

        {sortedQuestions.length ? (
          <div className="quiz-questions-list">
            {sortedQuestions.map((q: any, index: number) => (
              <Card key={q.id} className="quiz-question-card">
                {editingQuestionId === q.id ? (
                  <form className="quiz-question-edit-form" onSubmit={saveEditQuestion}>
                    <div className="section-heading quiz-section-heading">
                      <h3>{t('quizBuilder.editQuestion', { index: index + 1 })}</h3>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingQuestionId(null)} icon={<X size={14} />}>
                        {t('quizBuilder.cancel')}
                      </Button>
                    </div>
                    <Textarea
                      label={t('quizBuilder.questionText')}
                      value={editDraft.textAr}
                      onChange={(e) => setEditDraft({ ...editDraft, textAr: e.target.value })}
                      rows={3}
                    />
                    <Select
                      label={t('quizBuilder.questionType')}
                      value={editDraft.type}
                      onChange={(e) => changeEditQuestionType(e.target.value as QuestionType)}
                      options={[
                        { label: t('quizBuilder.typeMcq'), value: 'MULTIPLE_CHOICE' },
                        { label: t('quizBuilder.typeTrueFalse'), value: 'TRUE_FALSE' },
                      ]}
                    />
                    <div className="quiz-answers-panel">
                      <span className="quiz-answers-panel-title">{t('quizBuilder.answers')}</span>
                      {renderAnswerEditor(editDraft, setEditDraft)}
                    </div>
                    {editError ? <p className="field-error">{editError}</p> : null}
                    <div className="chip-row quiz-question-actions">
                      <Button type="submit" loading={savingQuestion} icon={<Save size={14} />}>{t('quizBuilder.saveEdits')}</Button>
                      <Button type="button" variant="ghost" onClick={() => setEditingQuestionId(null)}>{t('quizBuilder.cancel')}</Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="section-heading quiz-section-heading">
                      <div className="quiz-question-head">
                        <span className="quiz-question-index">{t('quizBuilder.questionIndex', { index: index + 1 })}</span>
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
                        {t('quizBuilder.editQuestionBtn')}
                      </Button>
                      <Button type="button" size="sm" variant="danger" onClick={() => setDeleteTarget({ type: 'question', item: q })} icon={<Trash2 size={14} />}>
                        {t('quizBuilder.delete')}
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="quiz-empty-questions-card">
            <EmptyState title={t('quizBuilder.noQuestionsTitle')} description={t('quizBuilder.noQuestionsDesc')} />
          </Card>
        )}
      </section>

      <Card className="quiz-builder-footer">
        <p>{t('quizBuilder.footerHint')}</p>
        <Link to={builderUrl} className="btn btn-secondary">
          {t('quizBuilder.backToBuilder')}
        </Link>
      </Card>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'quiz' ? t('quizBuilder.deleteQuizTitle') : t('quizBuilder.deleteQuestionTitle')}
        message={deleteTarget?.type === 'quiz' ? t('quizBuilder.deleteQuizMessage') : t('quizBuilder.deleteQuestionMessage')}
        confirmLabel={t('quizBuilder.confirmDelete')}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
