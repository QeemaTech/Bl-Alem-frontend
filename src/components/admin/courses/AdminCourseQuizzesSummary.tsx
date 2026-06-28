import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from '@/icons';
import { cn } from '@/lib/cn';
import { localizedQuizTitle } from '../../../utils/localizedContent';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';

interface AdminCourseQuizzesSummaryProps {
  quizzes: any[];
}

export function AdminCourseQuizzesSummary({ quizzes }: AdminCourseQuizzesSummaryProps) {
  const { t, i18n } = useTranslation('courses');
  const lang = i18n.language;
  const [openQuizzes, setOpenQuizzes] = useState<Set<number>>(() => new Set());

  if (!quizzes.length) return null;

  const toggleQuiz = (quizId: number) => {
    setOpenQuizzes((current) => {
      const next = new Set(current);
      if (next.has(quizId)) next.delete(quizId);
      else next.add(quizId);
      return next;
    });
  };

  return (
    <Card className="admin-course-quizzes-card">
      <h3>{t('admin.courses.detail.quizzes', { count: quizzes.length })}</h3>
      <div className="admin-course-quizzes">
        {quizzes.map((quiz) => {
          const isOpen = openQuizzes.has(quiz.id);
          const questions = [...(quiz.questions || [])].sort((a, b) => a.order - b.order);
          return (
            <div key={quiz.id} className={cn('admin-course-quiz-item', isOpen && 'is-open')}>
              <button
                type="button"
                className="admin-course-quiz-toggle"
                aria-expanded={isOpen}
                onClick={() => toggleQuiz(quiz.id)}
              >
                <ChevronDown size={18} className={cn('admin-course-accordion-chevron', isOpen && 'is-open')} />
                <span className="admin-course-quiz-toggle-copy">
                  <strong>{localizedQuizTitle(quiz, lang)}</strong>
                  <span className="muted-count">
                    {t('admin.courses.detail.quizMeta', {
                      questions: questions.length,
                      minutes: quiz.durationMinutes || 10,
                    })}
                  </span>
                </span>
              </button>
              {isOpen ? (
                <div className="admin-course-quiz-body">
                  {questions.length ? (
                    <ol className="admin-course-quiz-questions">
                      {questions.map((question, index) => {
                        const answers = question.answers || [];
                        return (
                          <li key={question.id} className="admin-course-quiz-question">
                            <p className="admin-course-quiz-question-text">
                              {t('admin.courses.detail.questionNumber', { number: index + 1 })}
                              {' '}
                              {question.textAr}
                            </p>
                            {answers.length ? (
                              <ul className="admin-course-quiz-answers">
                                {answers.map((answer: any) => (
                                  <li
                                    key={answer.id}
                                    className={cn('admin-course-quiz-answer', answer.isCorrect && 'is-correct')}
                                  >
                                    <span>{answer.textAr}</span>
                                    {answer.isCorrect ? (
                                      <Badge variant="success">{t('admin.courses.detail.correctAnswer')}</Badge>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="muted-count">{t('admin.courses.detail.noAnswers')}</p>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <p className="muted-count">{t('admin.courses.detail.noQuestions')}</p>
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
