import { useEffect, useState } from 'react';
import { instructorApi } from '../../../api/instructor';
import type { SidebarBadgeCounts } from './types';

const EMPTY: SidebarBadgeCounts = { live: 0, notifications: 0, rewards: 0 };

export function useInstructorSidebarBadges() {
  const [badges, setBadges] = useState<SidebarBadgeCounts>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const notifications = await instructorApi.notifications().catch(() => []);
        if (cancelled) return;

        const notificationCount = Array.isArray(notifications)
          ? notifications.filter((n: { isRead?: boolean }) => !n.isRead).length
          : 0;

        setBadges({ ...EMPTY, notifications: notificationCount });
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
