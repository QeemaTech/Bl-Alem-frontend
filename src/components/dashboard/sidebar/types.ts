import type { MaterialIcon } from '@/icons';

export interface SidebarNavItem {
  labelKey: string;
  path: string;
  icon: MaterialIcon;
  /** Dynamic badge key — resolved by sidebar badge hooks */
  badgeKey?: 'live' | 'notifications' | 'rewards';
}

export interface SidebarNavSection {
  id: string;
  labelKey: string;
  items: SidebarNavItem[];
}

export interface SidebarBadgeCounts {
  live: number;
  notifications: number;
  rewards: number;
}
