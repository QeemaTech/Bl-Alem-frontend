import { ProgressBar } from '../../ui/ProgressBar';

interface ProfileCompletionProps {
  value: number;
  compact?: boolean;
}

export function ProfileCompletion({ value, compact = false }: ProfileCompletionProps) {
  const hint = value >= 100 ? 'ملف مكتمل' : value >= 60 ? 'أوشكت على الإكمال' : 'أكمل بياناتك للحصول على توصيات أفضل';

  if (compact) {
    return (
      <div className="student-profile-completion">
        <ProgressBar value={value} label="اكتمال الملف" size="md" />
        <p className="student-profile-completion-hint">{hint}</p>
      </div>
    );
  }

  return (
    <section className="student-profile-completion" aria-label="اكتمال الملف الشخصي">
      <ProgressBar value={value} label="اكتمال الملف" size="md" />
      <p className="student-profile-completion-hint">{hint}</p>
    </section>
  );
}
