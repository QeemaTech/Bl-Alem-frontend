import { Award, GraduationCap, ShieldCheck, Trophy } from '@/icons';
import { StatCard } from '../../ui/StatCard';
import { LoadingSkeleton } from '../../ui/LoadingSkeleton';

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
  if (loading) {
    return (
      <div className="stats-grid student-profile-stats" aria-busy="true" aria-label="جاري تحميل الإحصائيات">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingSkeleton key={index} variant="stat" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const rewardPoints = stats.rewardsSummary?.rewardPoints ?? 0;

  return (
    <div className="stats-grid student-profile-stats" aria-label="إحصائيات الملف الشخصي">
      <StatCard
        title="كورسات مكتملة"
        value={String(stats.completedCourses || 0)}
        icon={GraduationCap}
        hint="إنجازات التعلم"
        className="student-profile-stat-card"
      />
      <StatCard
        title="الشهادات"
        value={String(stats.certificatesCount || 0)}
        icon={Award}
        hint="شهادات معتمدة"
        className="student-profile-stat-card"
      />
      <StatCard
        title="الإنجازات"
        value={String(rewardPoints)}
        icon={Trophy}
        hint="نقاط المكافآت"
        className="student-profile-stat-card"
      />
      <StatCard
        title="اكتمال الملف"
        value={`${completion}%`}
        icon={ShieldCheck}
        hint={completion >= 100 ? 'ملف مكتمل' : 'أكمل بياناتك'}
        className="student-profile-stat-card"
      />
    </div>
  );
}
