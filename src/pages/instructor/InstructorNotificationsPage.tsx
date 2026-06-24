import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck } from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { NotificationCard } from '../../components/instructor/notifications/NotificationCard';
import { NotificationFilters } from '../../components/instructor/notifications/NotificationFilters';
import type { NotificationFiltersState } from '../../components/instructor/notifications/NotificationFilters';
import { NotificationStats } from '../../components/instructor/notifications/NotificationStats';
import {
  IMPORTANT_TYPES,
  NOTIFICATION_TYPE_LABELS,
  type InstructorNotification,
} from '../../components/instructor/notifications/types';

const DEFAULT_FILTERS: NotificationFiltersState = {
  search: '',
  readFilter: '',
  typeFilter: '',
  dateFilter: '',
};

const matchesDateFilter = (createdAt: string, filter: string) => {
  if (!filter) return true;
  const date = new Date(createdAt);
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  if (filter === 'today') return date >= todayStart;
  if (filter === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }
  if (filter === 'month') {
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);
    return date >= monthAgo;
  }
  return true;
};

const fmtLastUpdated = (value: Date | null) => {
  if (!value) return '—';
  return value.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
};

export default function InstructorNotificationsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<InstructorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<NotificationFiltersState>(DEFAULT_FILTERS);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    const data = await instructorApi.notifications();
    setItems(data);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (filters.readFilter === 'read') result = result.filter((i) => i.isRead);
    if (filters.readFilter === 'unread') result = result.filter((i) => !i.isRead);
    if (filters.typeFilter) result = result.filter((i) => i.type === filters.typeFilter);
    if (filters.dateFilter) {
      result = result.filter((i) => matchesDateFilter(i.createdAt, filters.dateFilter));
    }
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter((i) =>
        [i.titleAr, i.bodyAr, NOTIFICATION_TYPE_LABELS[i.type], String(i.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, filters]);

  const stats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return {
      total: items.length,
      unread: items.filter((i) => !i.isRead).length,
      attention: items.filter((i) => !i.isRead && IMPORTANT_TYPES.has(i.type)).length,
      today: items.filter((i) => new Date(i.createdAt) >= todayStart).length,
    };
  }, [items]);

  const typeOptions = useMemo(() => {
    const types = [...new Set(items.map((i) => i.type).filter(Boolean))].sort();
    return [
      { label: 'كل الأنواع', value: '' },
      ...types.map((type) => ({ label: NOTIFICATION_TYPE_LABELS[type] || type, value: type })),
    ];
  }, [items]);

  const markRead = async (id: number) => {
    setBusyId(id);
    try {
      await instructorApi.markNotificationRead(id);
      setItems((current) => current.map((item) => (
        item.id === id ? { ...item, isRead: true } : item
      )));
      showToast('تم تعليم الإشعار كمقروء.', 'success');
    } catch {
      showToast('تعذّر تحديث الإشعار.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    const unread = items.filter((i) => !i.isRead);
    if (!unread.length) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map((i) => instructorApi.markNotificationRead(i.id)));
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      showToast(`تم تعليم ${unread.length} إشعار كمقروء.`, 'success');
    } catch {
      showToast('تعذّر تعليم الكل كمقروء.', 'error');
    } finally {
      setMarkingAll(false);
    }
  };

  const updateFilters = (patch: Partial<NotificationFiltersState>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  return (
    <div className="instructor-notifications-page">
      <header className="ntf-page-header">
        <div className="ntf-page-header-row">
          <div className="ntf-page-title-wrap">
            <h1>إشعارات المدرب</h1>
            <span className="ntf-count-badge">{stats.total}</span>
          </div>
          <div className="ntf-page-actions">
            <Button
              variant="secondary"
              size="sm"
              icon={<CheckCheck size={16} />}
              onClick={markAllRead}
              loading={markingAll}
              disabled={!stats.unread || loading}
            >
              تعليم الكل كمقروء
            </Button>
          </div>
        </div>
        <div className="ntf-page-header-meta">
          <p>تابع تحديثات الكورسات والأرباح والجلسات والتقييمات</p>
          <span className="ntf-last-updated">
            آخر تحديث: {fmtLastUpdated(lastUpdated)}
          </span>
        </div>
      </header>

      <NotificationStats stats={stats} />

      <NotificationFilters
        filters={filters}
        typeOptions={typeOptions}
        onChange={updateFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {loading ? (
        <div className="ntf-list" aria-busy="true" aria-label="جاري التحميل">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="ntf-skeleton-row" />
          ))}
        </div>
      ) : filteredItems.length ? (
        <div className="ntf-list">
          {filteredItems.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              busy={busyId === item.id}
              onMarkRead={markRead}
            />
          ))}
        </div>
      ) : items.length ? (
        <div className="ntf-empty-card">
          <EmptyState
            title="لا نتائج"
            description="جرّب تغيير الفلاتر أو البحث."
            icon={Bell}
          />
        </div>
      ) : (
        <div className="ntf-empty-card">
          <EmptyState
            title="لا توجد إشعارات"
            description="ستظهر تحديثات الكورسات والأرباح والجلسات هنا."
            icon={Bell}
          />
        </div>
      )}
    </div>
  );
}
