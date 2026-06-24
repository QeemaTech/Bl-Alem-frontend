import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
<<<<<<< Updated upstream
  AlertCircle, Award, CheckCircle2, ChevronLeft, Clock3, ListChecks, PlayCircle, XCircle,
} from 'lucide-react';
=======
  AlertCircle, Award, CheckCircle2, ChevronLeft, Clock3, ListChecks, PlayCircle, RotateCcw,
} from '@/icons';
>>>>>>> Stashed changes
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';

type QuizPhase = 'intro' | 'taking' | 'result';

const typeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: 'اختيار من متعدد',
  TRUE_FALSE: 'صح أو خطأ',
};

function QuizReviewSection({ questions }: { questions: any[] }) {
  if (!questions.length) return null;

  return (
    <div className="student-quiz-review">
      <h3>مراجعة الأسئلة وإجاباتك</h3>
      <div className="student-quiz-review-list">
        {questions.map((question: any, index: number) => (
          <Card key={question.id} className={`student-quiz-review-question ${question.isCorrect ? 'correct' : 'wrong'}`}>
            <div className="student-quiz-question-head">
              <span className="student-quiz-question-index">السؤال {index + 1}</span>
              <Badge variant={question.isCorrect ? 'success' : 'danger'}>
                {question.isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
              </Badge>
            </div>
            <h4>{question.textAr}</h4>
            <div className="student-quiz-options student-quiz-review-options">
              {question.answers?.map((answer: any) => {
                const isSelected = question.selectedAnswerId === answer.id;
                const isCorrectAnswer = answer.isCorrect;
                let optionClass = 'student-quiz-option review';
                if (isCorrectAnswer) optionClass += ' review-correct';
                if (isSelected && !isCorrectAnswer) optionClass += ' review-wrong';
                if (isSelected) optionClass += ' selected';

                return (
                  <div key={answer.id} className={optionClass}>
                    <span className="student-quiz-option-marker" />
                    <span className="student-quiz-option-text">{answer.textAr}</span>
                    {isSelected ? (
                      <span className="student-quiz-review-tag yours">إجابتك</span>
                    ) : null}
                    {isCorrectAnswer ? (
                      <span className="student-quiz-review-tag correct">الإجابة الصحيحة</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StudentQuizPage() {
  const { quizId } = useParams();
  const { showToast } = useToast();
  const autoSubmittedRef = useRef(false);

  const [quiz, setQuiz] = useState<any>(null);
  const [phase, setPhase] = useState<QuizPhase>('intro');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [attempt, setAttempt] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');

  const applyCompletedResult = (data: any) => {
    if (!data.result) return;
    setResult(data.result);
    const savedAnswers = Object.fromEntries(
      (data.result.reviewQuestions || [])
        .filter((question: any) => question.selectedAnswerId)
        .map((question: any) => [question.id, question.selectedAnswerId]),
    );
    setAnswers(savedAnswers);
    setPhase('result');
    setAttempt(null);
  };

  const loadQuiz = async () => {
    if (!quizId) return;
    setLoading(true);
    setLoadError('');
    try {
      const data = await studentApi.quiz(quizId);
      setQuiz(data);
      if (data.isCompleted && data.result) {
        applyCompletedResult(data);
      } else if (data.activeAttempt && data.isReady) {
        setAttempt({
          attemptId: data.activeAttempt.id,
          startedAt: data.activeAttempt.startedAt,
          durationMinutes: data.activeAttempt.durationMinutes,
          questionCount: data.questionCount,
          resumed: true,
        });
        setPhase('taking');
        setResult(null);
      } else {
        setPhase('intro');
        setAttempt(null);
        setAnswers({});
        setResult(null);
      }
    } catch {
      setQuiz(null);
      setLoadError('تعذّر تحميل الاختبار.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQuiz(); }, [quizId]);

  const durationSeconds = useMemo(
    () => Number(quiz?.durationMinutes || attempt?.durationMinutes || 0) * 60,
    [quiz, attempt],
  );

  useEffect(() => {
    if (phase !== 'taking' || !attempt || !durationSeconds) return;
    const startedAt = new Date(attempt.startedAt).getTime();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setTimeLeft(Math.max(0, durationSeconds - elapsed));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [phase, attempt, durationSeconds]);

  const questions = quiz?.questions || [];
  const answeredCount = questions.filter((q: any) => answers[q.id]).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  const submitQuiz = async (force = false) => {
    if (!quizId || submitting || phase !== 'taking') return;
    if (!force && !allAnswered) {
      showToast('أجب على جميع الأسئلة قبل التسليم.', 'error');
      return;
    }
    setSubmitting(true);
    const payload = Object.entries(answers).map(([questionId, answerId]) => ({
      questionId: Number(questionId),
      answerId,
    }));
    try {
      const data = await studentApi.submitQuiz(quizId, payload);
      setResult(data);
      setPhase('result');
      setQuiz((current: any) => (current ? { ...current, isCompleted: true, result: data } : current));
      showToast('تم تسليم الاختبار. لا يمكن إعادته.', 'success');
    } catch {
      showToast('تعذّر تسليم الاختبار.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (phase === 'taking' && timeLeft === 0 && !result && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      submitQuiz(true);
    }
  }, [timeLeft, phase, result]);

  const startQuiz = async () => {
    if (!quizId || !quiz?.isReady || quiz?.isCompleted) return;
    setStarting(true);
    try {
      const attemptData = await studentApi.startQuiz(quizId);
      setAttempt(attemptData);
      setAnswers({});
      setResult(null);
      setPhase('taking');
      autoSubmittedRef.current = false;
      if (attemptData.resumed) showToast('تم استئناف محاولتك السابقة.', 'info');
    } catch {
      showToast('لا يمكن بدء الاختبار. ربما أنهيته مسبقاً.', 'error');
      await loadQuiz();
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await submitQuiz(false);
  };

  const selectAnswer = (questionId: number, answerId: number) => {
    setAnswers((current) => ({ ...current, [questionId]: answerId }));
  };

  const timeLabel = timeLeft != null
    ? `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`
    : '—';

  const timerVariant = timeLeft != null && timeLeft <= 60 ? 'danger' : 'default';

  const breadcrumb = [
    { label: 'كورساتي', to: '/student/my-courses' },
    ...(quiz?.courseId ? [{ label: quiz.course?.titleAr || 'الدورة', to: `/student/player/${quiz.courseId}` }] : []),
    { label: quiz?.titleAr || 'الاختبار' },
  ];

  const playerUrl = quiz?.courseId ? `/student/player/${quiz.courseId}` : '/student/my-courses';
  const reviewQuestions = result?.reviewQuestions || [];

  if (loading) return <LoadingSkeleton variant="block" count={2} />;

  if (!quiz) {
    return (
      <div className="page-grid student-quiz-page">
        <PageHeader title="الاختبار" breadcrumb={[{ label: 'كورساتي', to: '/student/my-courses' }, { label: 'الاختبار' }]} />
        <Card><EmptyState title="الاختبار غير موجود" description={loadError || 'لم نتمكن من تحميل هذا الاختبار.'} /></Card>
      </div>
    );
  }

  if (phase === 'result' && result) {
    return (
      <div className="page-grid student-quiz-page">
        <PageHeader title="نتيجة الاختبار" breadcrumb={breadcrumb} />
        <Card className="student-quiz-result">
          <div className={`student-quiz-result-ring ${result.isPassed ? 'passed' : 'failed'}`}>
            {result.isPassed ? <Award size={36} /> : <XCircle size={36} />}
            <strong>{result.score}%</strong>
          </div>
          <Badge variant={result.isPassed ? 'success' : 'danger'}>
            {result.isPassed ? 'ناجح' : 'لم تحقق درجة النجاح'}
          </Badge>
          <h2>{quiz.titleAr}</h2>
          <p>
            {result.correctAnswers} من {result.totalQuestions} إجابات صحيحة
            {' · '}درجة النجاح المطلوبة: {result.passingScore || quiz.passingScore}%
          </p>
          {result.attempt?.completedAt ? (
            <p className="student-quiz-result-time">
              وقت التسليم: {new Date(result.attempt.completedAt).toLocaleString('ar-SA')}
            </p>
          ) : null}
          <p className="student-quiz-result-note">
            تم تسليم الاختبار نهائياً ولا يمكن إعادته.
          </p>
          <div className="student-quiz-result-actions">
            <Link to={playerUrl}>
              <Button icon={<ChevronLeft size={16} />}>العودة للمشغل</Button>
            </Link>
          </div>
        </Card>
        <QuizReviewSection questions={reviewQuestions} />
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="page-grid student-quiz-page">
        <PageHeader title={quiz.titleAr} subtitle="راجع التعليمات ثم ابدأ الاختبار" breadcrumb={breadcrumb} />
        <Card className="student-quiz-intro">
          <div className="student-quiz-intro-grid">
            <div className="student-quiz-intro-main">
              <h2>{quiz.titleAr}</h2>
              {quiz.course?.titleAr ? <p>الدورة: {quiz.course.titleAr}</p> : null}
              {quiz.lesson?.titleAr ? <p>مرتبط بالدرس: {quiz.lesson.titleAr}</p> : null}
              <div className="student-quiz-meta">
                <span><Clock3 size={16} /> {quiz.durationMinutes} دقيقة</span>
                <span><ListChecks size={16} /> {quiz.questionCount} سؤال</span>
                <span><Award size={16} /> النجاح: {quiz.passingScore}%</span>
              </div>
              {!quiz.isReady ? (
                <div className="student-quiz-alert">
                  <AlertCircle size={18} />
                  <div>
                    <strong>الاختبار غير جاهز بعد</strong>
                    <p>لم يضف المدرب أسئلة كافية لهذا الاختبار. تواصل معه أو عد لاحقاً.</p>
                  </div>
                </div>
              ) : (
                <ul className="student-quiz-rules">
                  <li>بعد البدء يبدأ العد التنازلي ولا يمكن إيقافه.</li>
                  <li>أجب على جميع الأسئلة قبل التسليم.</li>
                  <li>بعد التسليم لا يمكن إعادة الاختبار، وستظهر لك إجاباتك للمراجعة.</li>
                </ul>
              )}
            </div>
            <div className="student-quiz-intro-side">
              <Button
                fullWidth
                size="lg"
                disabled={!quiz.isReady}
                loading={starting}
                onClick={startQuiz}
                icon={<PlayCircle size={18} />}
              >
                {quiz.isReady ? 'بدء الاختبار' : 'غير متاح حالياً'}
              </Button>
              <Link to={playerUrl}>
                <Button fullWidth variant="ghost" icon={<ChevronLeft size={16} />}>العودة للمشغل</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-grid student-quiz-page">
      <PageHeader title={quiz.titleAr} breadcrumb={breadcrumb} />

      <div className="student-quiz-toolbar">
        <div className="student-quiz-toolbar-item">
          <Clock3 size={18} />
          <span>الوقت المتبقي</span>
          <strong className={timerVariant === 'danger' ? 'timer-danger' : ''}>{timeLabel}</strong>
        </div>
        <div className="student-quiz-toolbar-item">
          <ListChecks size={18} />
          <span>التقدم</span>
          <strong>{answeredCount} / {questions.length}</strong>
        </div>
        <div className="student-quiz-toolbar-item">
          <Award size={18} />
          <span>درجة النجاح</span>
          <strong>{quiz.passingScore}%</strong>
        </div>
      </div>

      {!questions.length ? (
        <Card>
          <EmptyState
            title="لا توجد أسئلة"
            description="هذا الاختبار لا يحتوي على أسئلة جاهزة للعرض."
            icon={AlertCircle}
          />
        </Card>
      ) : (
        <form className="student-quiz-form" onSubmit={handleSubmit}>
          {questions.map((question: any, index: number) => (
            <Card key={question.id} className="student-quiz-question">
              <div className="student-quiz-question-head">
                <span className="student-quiz-question-index">السؤال {index + 1}</span>
                <Badge variant="info">{typeLabels[question.type] || question.type}</Badge>
              </div>
              <h3>{question.textAr}</h3>
              <div className="student-quiz-options">
                {question.answers?.map((answer: any) => {
                  const selected = answers[question.id] === answer.id;
                  return (
                    <label
                      key={answer.id}
                      className={`student-quiz-option ${selected ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        checked={selected}
                        onChange={() => selectAnswer(question.id, answer.id)}
                      />
                      <span className="student-quiz-option-marker" />
                      <span className="student-quiz-option-text">{answer.textAr}</span>
                      {selected ? <CheckCircle2 size={18} className="student-quiz-option-check" /> : null}
                    </label>
                  );
                })}
              </div>
            </Card>
          ))}

          <Card className="student-quiz-submit-card">
            <p>
              {allAnswered
                ? 'أجبت على جميع الأسئلة. يمكنك التسليم الآن.'
                : `باقي ${questions.length - answeredCount} سؤال لم يُجب عليه.`}
            </p>
            <div className="student-quiz-submit-actions">
              <Button type="submit" loading={submitting} disabled={!allAnswered} size="lg">
                تسليم الاختبار نهائياً
              </Button>
              <Link to={playerUrl}>
                <Button type="button" variant="ghost">العودة للمشغل</Button>
              </Link>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}

export default StudentQuizPage;
