import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff, CalendarDays, CheckCheck } from '@/icons';
import { instructorApi } from '../../api/instructor';
import type { InstructorNotification } from '../../components/instructor/notifications/types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { useInstructorNotificationLabels } from '../../hooks/useInstructorNotificationLabels';

export default function InstructorNotificationsPage() {
  const { t } = useTranslation('notifications');
  const {
    typeLabel,
    notificationTitle,
    notificationBody,
    fmtRelative,
    lang,
  } = useInstructorNotificationLabels();
  const { showToast } = useToast();
  const [items, setItems] = useState<InstructorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const tableColumns = useMemo(
    () => t('instructor.table.columns', { returnObjects: true }) as Record<string, string>,
    [t, lang],
  );

  const load = async () => {
    setItems(await instructorApi.notifications());
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
  }, [items, readFilter, typeFilter, search, notificationTitle, notificationBody, typeLabel]);

  const stats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return {
      total: items.length,
      unread: items.filter((i) => !i.isRead).length,
      read: items.filter((i) => i.isRead).length,
      today: items.filter((i) => new Date(i.createdAt) >= todayStart).length,
    };
  }, [items]);

  const typeOptions = useMemo(() => {
    const types = [...new Set(items.map((i) => i.type).filter(Boolean))].sort();
    return [
      { label: t('instructor.filters.allTypes'), value: '' },
      ...types.map((type) => ({ label: typeLabel(type), value: type })),
    ];
  }, [items, typeLabel, t, lang]);

  const tableRows = useMemo(() => filteredItems.map((row) => {
    const body = notificationBody(row);
    return {
      id: row.id,
      title: notificationTitle(row),
      body: body.length > 50 ? `${body.slice(0, 50)}...` : body,
      type: typeLabel(row.type),
      readStatus: row.isRead
        ? t('instructor.labels.readStatus.read')
        : t('instructor.labels.readStatus.unread'),
      createdAt: fmtRelative(row.createdAt),
      _raw: row,
    };
  }), [filteredItems, notificationTitle, notificationBody, typeLabel, fmtRelative, t, lang]);

  const hasActiveFilters = Boolean(search.trim() || readFilter || typeFilter);

  const markRead = async (id: number) => {
    setBusyId(id);
    try {
      await instructorApi.markNotificationRead(id);
      setItems((current) => current.map((item) => (
        item.id === id ? { ...item, isRead: true } : item
      )));
      showToast(t('instructor.toast.markedRead'), 'success');
    } catch {
      showToast(t('instructor.toast.markReadFailed'), 'error');
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
      showToast(t('instructor.toast.markedAllRead', { count: unread.length }), 'success');
    } catch {
      showToast(t('instructor.toast.markAllReadFailed'), 'error');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title={t('instructor.title')}
          subtitle={t('instructor.subtitle')}
        />
        <div className="chip-row">
          <Button
            variant="outline"
            icon={<CheckCheck size={18} />}
            onClick={markAllRead}
            loading={markingAll}
            disabled={!stats.unread || loading}
          >
            {t('instructor.actions.markAllRead')}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('instructor.stats.total')} value={String(stats.total)} icon={Bell} />
        <StatCard title={t('instructor.stats.unread')} value={String(stats.unread)} icon={BellOff} />
        <StatCard title={t('instructor.stats.read')} value={String(stats.read)} icon={Bell} />
        <StatCard title={t('instructor.stats.today')} value={String(stats.today)} icon={CalendarDays} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('instructor.filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setReadFilter(''); setTypeFilter(''); }}
        resetDisabled={!hasActiveFilters}
        ariaLabel={t('instructor.filters.ariaLabel')}
      >
        <Select
          label={t('instructor.filters.type')}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={typeOptions}
        />
        <Select
          label={t('instructor.filters.readStatus')}
          value={readFilter}
          onChange={(e) => setReadFilter(e.target.value)}
          options={[
            { label: t('instructor.filters.all'), value: '' },
            { label: t('instructor.filters.unread'), value: 'unread' },
            { label: t('instructor.filters.read'), value: 'read' },
          ]}
        />
      </FilterBar>

      <Card className="reports-table-card">
        <Table
          loading={loading}
          data={tableRows}
          emptyTitle={hasActiveFilters ? t('instructor.table.noResultsTitle') : t('instructor.table.emptyTitle')}
          emptyDescription={
            hasActiveFilters
              ? t('instructor.table.noResultsDescription')
              : t('instructor.table.emptyDescription')
          }
          columns={[
            { key: 'id', header: tableColumns.id, align: 'center' },
            { key: 'title', header: tableColumns.title, wrap: true },
            { key: 'body', header: tableColumns.body, wrap: true, hideOnMobile: true },
            { key: 'type', header: tableColumns.type },
            {
              key: 'readStatus',
              header: tableColumns.status,
              align: 'center',
              render: (row) => (
                <Badge
                  variant={row._raw?.isRead ? 'default' : 'info'}
                  dot
                  className="status-badge"
                >
                  {row.readStatus}
                </Badge>
              ),
            },
            { key: 'createdAt', header: tableColumns.createdAt, align: 'center', hideOnMobile: true },
            {
              key: 'actions',
              header: tableColumns.actions,
              align: 'center',
              render: (row) => (
                !row._raw?.isRead ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={busyId === row._raw.id}
                    onClick={() => markRead(row._raw.id)}
                  >
                    {t('instructor.actions.markRead')}
                  </Button>
                ) : (
                  <span className="muted-count">{t('instructor.actions.readDone')}</span>
                )
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
