import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Download, Eye, Headphones, HelpCircle, MessageSquare, MessageSquarePlus, Table2,
} from '@/icons';
import { adminApi } from '../../api/admin';
import { AdminSupportFaqPanel } from '../../components/admin/support/AdminSupportFaqPanel';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { useAdminSupportLabels } from '../../hooks/useAdminSupportLabels';
import { exportTableToExcel } from '../../utils/exportExcel';
import { formatNumber } from '../../utils/localeFormat';

export default function AdminSupportPage() {
  const { t, i18n } = useTranslation(['support', 'common']);
  const navigate = useNavigate();
  const {
    getRoleLabel,
    getStatusLabel,
    fmtSupportDate,
    statusLabels,
    statusVariant,
  } = useAdminSupportLabels();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tab, setTab] = useState<'tickets' | 'faq'>('tickets');

  const exportColumns = useMemo(() => {
    const cols = t('admin.export.columns', { returnObjects: true, ns: 'support' }) as Record<string, string>;
    return [
      { key: 'id', header: cols.id },
      { key: 'user', header: cols.user },
      { key: 'email', header: cols.email },
      { key: 'role', header: cols.role },
      { key: 'subject', header: cols.subject },
      { key: 'message', header: cols.message },
      { key: 'repliesCount', header: cols.repliesCount },
      { key: 'status', header: cols.status },
      { key: 'createdAt', header: cols.createdAt },
      { key: 'updatedAt', header: cols.updatedAt },
    ];
  }, [t]);

  const tableColumns = useMemo(() => (
    t('admin.table.columns', { returnObjects: true, ns: 'support' }) as Record<string, string>
  ), [t]);

  const load = async () => {
    setLoading(true);
    setItems(await adminApi.supportTickets());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [i.subject, i.message, i.user?.fullName, i.user?.email, String(i.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, statusFilter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    open: items.filter((i) => i.status === 'OPEN').length,
    inProgress: items.filter((i) => i.status === 'IN_PROGRESS').length,
    closed: items.filter((i) => i.status === 'CLOSED').length,
  }), [items]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    user: row.user?.fullName || '—',
    email: row.user?.email || '—',
    role: getRoleLabel(row.user?.role) || row.user?.role || '—',
    subject: row.subject,
    message: row.message?.length > 60 ? `${row.message.slice(0, 60)}...` : row.message,
    repliesCount: row._count?.replies ?? 0,
    status: getStatusLabel(row.status),
    createdAt: fmtSupportDate(row.createdAt),
    updatedAt: fmtSupportDate(row.updatedAt),
    _raw: row,
  })), [filteredItems, getRoleLabel, getStatusLabel, fmtSupportDate]);

  const ticketCountLabel = t('admin.table.ticketCount', {
    count: filteredItems.length,
    ns: 'support',
    replace: { count: formatNumber(filteredItems.length, undefined, i18n.language) },
  });

  const handleExport = () => {
    exportTableToExcel(
      t('admin.export.sheetName', { ns: 'support' }),
      exportColumns,
      tableRows.map(({ _raw, message, ...row }) => ({
        ...row,
        message: _raw.message || message,
      })),
    );
  };

  return (
    <div className="page-grid admin-support-page">
      <div className="reports-header">
        <PageHeader
          title={t('admin.title', { ns: 'support' })}
          subtitle={t('admin.subtitle', { ns: 'support' })}
        />
        {tab === 'tickets' ? (
          <div className="reports-header-actions">
            <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
              {t('admin.exportExcel', { ns: 'support' })}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="support-admin-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={tab === 'tickets' ? 'is-active' : ''}
          aria-selected={tab === 'tickets'}
          onClick={() => setTab('tickets')}
        >
          <Headphones size={18} />
          {t('admin.tabs.tickets', { ns: 'support' })}
        </button>
        <button
          type="button"
          role="tab"
          className={tab === 'faq' ? 'is-active' : ''}
          aria-selected={tab === 'faq'}
          onClick={() => setTab('faq')}
        >
          <HelpCircle size={18} />
          {t('admin.tabs.faq', { ns: 'support' })}
        </button>
      </div>

      {tab === 'faq' ? (
        <AdminSupportFaqPanel />
      ) : (
        <>
      <div className="stats-grid admin-support-stats">
        <StatCard title={t('admin.stats.total', { ns: 'support' })} value={String(stats.total)} icon={Headphones} />
        <StatCard title={t('admin.stats.open', { ns: 'support' })} value={String(stats.open)} icon={MessageSquarePlus} />
        <StatCard title={t('admin.stats.inProgress', { ns: 'support' })} value={String(stats.inProgress)} icon={MessageSquare} />
        <StatCard title={t('admin.stats.closed', { ns: 'support' })} value={String(stats.closed)} icon={CheckCircle2} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('admin.filters.searchPlaceholder', { ns: 'support' })}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label={t('admin.filters.status', { ns: 'support' })}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: t('admin.filters.allStatuses', { ns: 'support' }), value: '' },
            { label: statusLabels.OPEN, value: 'OPEN' },
            { label: statusLabels.IN_PROGRESS, value: 'IN_PROGRESS' },
            { label: statusLabels.CLOSED, value: 'CLOSED' },
          ]}
        />
      </FilterBar>

      <Card className="reports-table-card">
        <div className="section-heading reports-table-head">
          <h2>
            <span className="reports-table-title-icon" aria-hidden="true">
              <Table2 size={20} />
            </span>
            {t('admin.table.title', { ns: 'support' })}
          </h2>
          <span className="muted-count">{ticketCountLabel}</span>
        </div>
        <Table
          loading={loading}
          fluid
          hideScrollNotice
          data={tableRows}
          emptyTitle={t('admin.table.emptyTitle', { ns: 'support' })}
          emptyDescription={t('admin.table.emptyDescription', { ns: 'support' })}
          columns={[
            { key: 'id', header: tableColumns.id, align: 'center' },
            { key: 'user', header: tableColumns.user },
            { key: 'role', header: tableColumns.role },
            { key: 'subject', header: tableColumns.subject },
            { key: 'repliesCount', header: tableColumns.repliesCount, align: 'center' },
            {
              key: 'status',
              header: tableColumns.status,
              align: 'center',
              render: (row) => (
                <Badge variant={statusVariant(String(row._raw?.status))}>
                  {getStatusLabel(String(row._raw?.status))}
                </Badge>
              ),
            },
            { key: 'createdAt', header: tableColumns.createdAt },
            {
              key: 'actions',
              header: tableColumns.actions,
              render: (row) => (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Eye size={16} />}
                  onClick={() => navigate(`/admin/support/${row._raw.id}`)}
                >
                  {t('admin.actions.view', { ns: 'support' })}
                </Button>
              ),
            },
          ]}
        />
      </Card>
        </>
      )}
    </div>
  );
}
