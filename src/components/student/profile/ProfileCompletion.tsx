import { useTranslation } from 'react-i18next';
import { ProgressBar } from '../../ui/ProgressBar';
import { useStudentProfileLabels } from '../../../hooks/useStudentProfileLabels';

interface ProfileCompletionProps {
  value: number;
  compact?: boolean;
}

export function ProfileCompletion({ value, compact = false }: ProfileCompletionProps) {
  const { t } = useTranslation('profile');
  const { completionHint } = useStudentProfileLabels();
  const hint = completionHint(value);

  if (compact) {
    return (
      <div className="student-profile-completion">
        <ProgressBar value={value} label={t('student.completion.label')} size="md" />
        <p className="student-profile-completion-hint">{hint}</p>
      </div>
    );
  }

  return (
    <section className="student-profile-completion" aria-label={t('student.completion.aria')}>
      <ProgressBar value={value} label={t('student.completion.label')} size="md" />
      <p className="student-profile-completion-hint">{hint}</p>
    </section>
  );
}
