import { useEffect, useState } from 'react';
import { studentApi } from '../../../api/student';
import type { SidebarBadgeCounts } from './types';

const EMPTY: SidebarBadgeCounts = { live: 0, notifications: 0, rewards: 0 };

export function useStudentSidebarBadges() {
  const [badges, setBadges] = useState<SidebarBadgeCounts>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [liveData, notifications, rewardsData] = await Promise.all([
          studentApi.liveSessions().catch(() => ({ liveNow: [], upcoming: [] })),
          studentApi.notifications().catch(() => []),
          studentApi.rewards().catch(() => null),
        ]);

        if (cancelled) return;

        const liveCount =
          (liveData?.liveNow?.length ?? 0) + (liveData?.upcoming?.length ?? 0);

        const notificationCount = Array.isArray(notifications)
          ? notifications.filter((n: { isRead?: boolean }) => !n.isRead).length
          : 0;

        const invited = rewardsData?.invitedUsers ?? [];
        const pendingRewards = Array.isArray(invited)
          ? invited.filter((i: { rewardStatus?: string }) => i.rewardStatus === 'PENDING').length
          : 0;

        setBadges({
          live: liveCount,
          notifications: notificationCount,
          rewards: pendingRewards,
        });
      } catch {
        if (!cancelled) setBadges(EMPTY);
      }
    };

    load();
    const interval = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return badges;
}
