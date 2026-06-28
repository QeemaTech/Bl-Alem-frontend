import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { localizedText } from '../../utils/localizedContent';
import { formatDateTime, formatNumber } from '../../utils/localeFormat';

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

export default function StudentNotificationsPage() {
  const { t, i18n } = useTranslation('notifications');
  const lang = i18n.language;
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const typeLabel = useCallback(
    (type: string) => t(`student.labels.type.${type}`, { defaultValue: type || t('student.labels.fallbackType') }),
    [t, lang],
  );

  const notificationTitle = useCallback(
    (item: any) => localizedText({ ar: item.titleAr, en: item.titleEn }, lang),
    [lang],
  );

  const notificationBody = useCallback(
    (item: any) => localizedText({ ar: item.bodyAr, en: item.bodyEn }, lang),
    [lang],
  );

  const fmtRelative = useCallback((value: string) => {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return t('student.time.now');
    if (mins < 60) return t('student.time.minutesAgo', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('student.time.hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t('student.time.daysAgo', { count: days });
    return formatDateTime(value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }, lang);
  }, [t, lang]);

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
        [notificationTitle(i), notificationBody(i), typeLabel(i.type), String(i.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, readFilter, typeFilter, search, lang, notificationTitle, notificationBody, typeLabel]);

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
      { label: t('student.filters.allTypes'), value: '' },
      ...types.map((type) => ({ label: typeLabel(type), value: type })),
    ];
  }, [items, lang, t, typeLabel]);

  const hasActiveFilters = Boolean(search.trim() || readFilter || typeFilter);

  const markRead = async (id: number) => {
    setBusyId(id);
    try {
      await studentApi.markNotificationRead(id);
      setItems((current) => current.map((item) => (
        item.id === id ? { ...item, isRead: true } : item
      )));
      showToast(t('student.toast.markedRead'), 'success');
    } catch {
      showToast(t('student.toast.markReadFailed'), 'error');
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
      showToast(t('student.toast.markedAllRead', { count: unread.length }), 'success');
    } catch {
      showToast(t('student.toast.markAllReadFailed'), 'error');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="page-grid student-notifications-page">
      <div className="reports-header">
        <PageHeader
          title={t('student.title')}
          subtitle={t('student.subtitle')}
        />
        <div className="reports-header-actions">
          <Button
            variant="outline"
            icon={<CheckCheck size={18} />}
            onClick={markAllRead}
            loading={markingAll}
            disabled={!stats.unread || loading}
          >
            {t('student.actions.markAllRead')}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('student.stats.total')} value={String(stats.total)} icon={Bell} />
        <StatCard
          title={t('student.stats.unread')}
          value={String(stats.unread)}
          icon={BellOff}
          hint={stats.unread ? t('student.stats.unreadHintActive') : t('student.stats.unreadHintClear')}
        />
        <StatCard title={t('student.stats.today')} value={String(stats.today)} icon={CalendarDays} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('student.filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setReadFilter(''); setTypeFilter(''); }}
        resetDisabled={!hasActiveFilters}
        ariaLabel={t('student.filters.ariaLabel')}
      >
        <Select
          label={t('student.filters.readStatus')}
          value={readFilter}
          onChange={(e) => setReadFilter(e.target.value)}
          options={[
            { label: t('student.filters.all'), value: '' },
            { label: t('student.filters.unread'), value: 'unread' },
            { label: t('student.filters.read'), value: 'read' },
          ]}
        />
        <Select
          label={t('student.filters.type')}
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
            {t('student.table.title')}
          </h2>
          <span className="muted-count">
            {t('student.table.count', { count: formatNumber(filteredItems.length, undefined, lang) })}
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
              const label = typeLabel(item.type);
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
                        <h3>{notificationTitle(item)}</h3>
                        <Badge
                          variant={item.isRead ? 'default' : 'info'}
                          dot
                          className="status-badge"
                        >
                          {item.isRead ? t('student.labels.readStatus.read') : t('student.labels.readStatus.unread')}
                        </Badge>
                      </div>
                      <span className="student-notification-type">{label}</span>
                    </div>
                    <p className="student-notification-text">{notificationBody(item)}</p>
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
                        {t('student.actions.markRead')}
                      </Button>
                    ) : (
                      <span className="student-notification-done">
                        <Check size={14} aria-hidden="true" />
                        {t('student.actions.read')}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : items.length ? (
          <EmptyState
            title={t('student.table.noResultsTitle')}
            description={t('student.table.noResultsDescription')}
            icon={Bell}
          />
        ) : (
          <EmptyState
            title={t('student.table.emptyTitle')}
            description={t('student.table.emptyDescription')}
            icon={Bell}
          />
        )}
      </Card>
    </div>
  );
}
