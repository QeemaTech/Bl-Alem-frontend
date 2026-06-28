import { useTranslation } from 'react-i18next';
import { Award, GraduationCap, ShieldCheck, Trophy } from '@/icons';
import { StatCard } from '../../ui/StatCard';
import { LoadingSkeleton } from '../../ui/LoadingSkeleton';
import { useStudentProfileLabels } from '../../../hooks/useStudentProfileLabels';

interface DashboardStats {
  completedCourses?: number;
  certificatesCount?: number;
  rewardsSummary?: {
    rewardPoints?: number;
  };
}

interface ProfileStatisticsCardsProps {
  stats: DashboardStats | null;
  completion: number;
  loading?: boolean;
}

export function ProfileStatisticsCards({ stats, completion, loading }: ProfileStatisticsCardsProps) {
  const { t } = useTranslation('profile');
  const { statsCompletionHint } = useStudentProfileLabels();

  if (loading) {
    return (
      <div className="stats-grid student-profile-stats" aria-busy="true" aria-label={t('student.loadingStats')}>
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingSkeleton key={index} variant="stat" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const rewardPoints = stats.rewardsSummary?.rewardPoints ?? 0;

  return (
    <div className="stats-grid student-profile-stats" aria-label={t('student.statsAria')}>
      <StatCard
        title={t('student.stats.completedCourses')}
        value={String(stats.completedCourses || 0)}
        icon={GraduationCap}
        hint={t('student.stats.completedHint')}
        className="student-profile-stat-card"
      />
      <StatCard
        title={t('student.stats.certificates')}
        value={String(stats.certificatesCount || 0)}
        icon={Award}
        hint={t('student.stats.certificatesHint')}
        className="student-profile-stat-card"
      />
      <StatCard
        title={t('student.stats.achievements')}
        value={String(rewardPoints)}
        icon={Trophy}
        hint={t('student.stats.achievementsHint')}
        className="student-profile-stat-card"
      />
      <StatCard
        title={t('student.stats.completion')}
        value={`${completion}%`}
        icon={ShieldCheck}
        hint={statsCompletionHint(completion)}
        className="student-profile-stat-card"
      />
    </div>
  );
}
