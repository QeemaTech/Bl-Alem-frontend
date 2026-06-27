import { useEffect, useMemo, useState } from 'react';
import {
  Award, Bell, BellOff, BookOpen, CalendarDays, Check, CheckCheck, CreditCard, Gift,
  MessageCircle, Radio, Sparkles,
} from '@/icons';
import type { MaterialIcon } from '@/icons';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';

const typeLabels: Record<string, string> = {
  WELCOME: 'ترحيب',
  LIVE_SESSION: 'جلسة مباشرة',
  CERTIFICATE: 'شهادة',
  REWARD: 'مكافأة',
  PAYMENT: 'دفع',
  COMMUNITY: 'مجتمع',
  SUBSCRIPTION: 'اشتراك',
  COURSE: 'كورس',
  SUPPORT: 'دعم فني',
  REFERRAL: 'إحالة',
  QUIZ: 'اختبار',
  ADMIN: 'إداري',
};

const typeIcons: Record<string, MaterialIcon> = {
  WELCOME: Sparkles,
  LIVE_SESSION: Radio,
  CERTIFICATE: Award,
  REWARD: Gift,
  PAYMENT: CreditCard,
  COMMUNITY: MessageCircle,
  SUBSCRIPTION: BookOpen,
  COURSE: BookOpen,
  SUPPORT: MessageCircle,
  REFERRAL: Gift,
};

const fmtRelative = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} يوم`;
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function StudentNotificationsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = async () => {
    setItems(await studentApi.notifications());
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (readFilter === 'read') result = result.filter((i) => i.isRead);
    if (readFilter === 'unread') result = result.filter((i) => !i.isRead);
    if (typeFilter) result = result.filter((i) => i.type === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [i.titleAr, i.bodyAr, typeLabels[i.type], String(i.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, readFilter, typeFilter, search]);

  const stats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return {
      total: items.length,
      unread: items.filter((i) => !i.isRead).length,
      today: items.filter((i) => new Date(i.createdAt) >= todayStart).length,
    };
  }, [items]);

  const typeOptions = useMemo(() => {
    const types = [...new Set(items.map((i) => i.type).filter(Boolean))].sort();
    return [
      { label: 'كل الأنواع', value: '' },
      ...types.map((type) => ({ label: typeLabels[type] || type, value: type })),
    ];
  }, [items]);

  const hasActiveFilters = Boolean(search.trim() || readFilter || typeFilter);

  const markRead = async (id: number) => {
    setBusyId(id);
    try {
      await studentApi.markNotificationRead(id);
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
      await Promise.all(unread.map((i) => studentApi.markNotificationRead(i.id)));
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      showToast(`تم تعليم ${unread.length} إشعار كمقروء.`, 'success');
    } catch {
      showToast('تعذّر تعليم الكل كمقروء.', 'error');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="page-grid student-notifications-page">
      <div className="reports-header">
        <PageHeader
          title="الإشعارات"
          subtitle="تابع تحديثات الدورات والدعم والمكافآت والمجتمع"
        />
        <div className="reports-header-actions">
          <Button
            variant="outline"
            icon={<CheckCheck size={18} />}
            onClick={markAllRead}
            loading={markingAll}
            disabled={!stats.unread || loading}
          >
            تعليم الكل كمقروء
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي الإشعارات" value={String(stats.total)} icon={Bell} />
        <StatCard
          title="غير مقروء"
          value={String(stats.unread)}
          icon={BellOff}
          hint={stats.unread ? 'تحتاج متابعة' : 'لا جديد'}
        />
        <StatCard title="اليوم" value={String(stats.today)} icon={CalendarDays} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالعنوان أو النص..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setReadFilter(''); setTypeFilter(''); }}
        resetDisabled={!hasActiveFilters}
        ariaLabel="فلاتر الإشعارات"
      >
        <Select
          label="حالة القراءة"
          value={readFilter}
          onChange={(e) => setReadFilter(e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'غير مقروء', value: 'unread' },
            { label: 'مقروء', value: 'read' },
          ]}
        />
        <Select
          label="النوع"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={typeOptions}
        />
      </FilterBar>

      <Card className="reports-table-card">
        <div className="section-heading reports-table-head">
          <h2>
            <span className="reports-table-title-icon" aria-hidden="true">
              <Bell size={20} />
            </span>
            قائمة الإشعارات
          </h2>
          <span className="muted-count">
            {filteredItems.length.toLocaleString('ar-EG')} إشعار
          </span>
        </div>

        {loading ? (
          <div className="student-notifications-list" aria-busy="true">
            <LoadingSkeleton variant="row" count={5} />
          </div>
        ) : filteredItems.length ? (
          <div className="student-notifications-list">
            {filteredItems.map((item) => {
              const Icon = typeIcons[item.type] || Bell;
              const typeLabel = typeLabels[item.type] || 'إشعار';
              return (
                <article
                  key={item.id}
                  className={`student-notification-item ${item.isRead ? 'is-read' : 'is-unread'}`}
                >
                  <div
                    className={`student-notification-icon ${item.isRead ? 'is-read' : 'is-unread'}`}
                    aria-hidden="true"
                  >
                    <Icon size={20} />
                  </div>

                  <div className="student-notification-body">
                    <div className="student-notification-top">
                      <div className="student-notification-title-wrap">
                        <h3>{item.titleAr}</h3>
                        <Badge
                          variant={item.isRead ? 'default' : 'info'}
                          dot
                          className="status-badge"
                        >
                          {item.isRead ? 'مقروء' : 'غير مقروء'}
                        </Badge>
                      </div>
                      <span className="student-notification-type">{typeLabel}</span>
                    </div>
                    <p className="student-notification-text">{item.bodyAr}</p>
                    <time className="student-notification-time" dateTime={item.createdAt}>
                      {fmtRelative(item.createdAt)}
                    </time>
                  </div>

                  <div className="student-notification-actions">
                    {!item.isRead ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={busyId === item.id}
                        onClick={() => markRead(item.id)}
                      >
                        تعليم كمقروء
                      </Button>
                    ) : (
                      <span className="student-notification-done">
                        <Check size={14} aria-hidden="true" />
                        مقروء
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : items.length ? (
          <EmptyState
            title="لا نتائج"
            description="جرّب تغيير الفلاتر أو البحث."
            icon={Bell}
          />
        ) : (
          <EmptyState
            title="لا توجد إشعارات"
            description="ستظهر إشعارات الدورات والدعم والمكافآت هنا."
            icon={Bell}
          />
        )}
      </Card>
    </div>
  );
}
