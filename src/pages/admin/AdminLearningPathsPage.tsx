import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Download, FolderTree, Layers, Plus } from '@/icons';
import { adminApi } from '../../api/admin';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { useAdminLearningPathLabels } from '../../hooks/useAdminLearningPathLabels';
import { exportTableToExcel } from '../../utils/exportExcel';
import { localizedPathTitle } from '../../utils/localizedContent';

export default function AdminLearningPathsPage() {
  const { t, i18n } = useTranslation(['learningPaths', 'common']);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { statusLabels, fmtDate, statusVariant } = useAdminLearningPathLabels();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const exportColumns = useMemo(() => {
    const cols = t('admin.list.export.columns', { returnObjects: true }) as Record<string, string>;
    return [
      { key: 'id', header: cols.id },
      { key: 'titleAr', header: cols.titleAr },
      { key: 'courses', header: cols.courses },
      { key: 'status', header: cols.status },
      { key: 'createdAt', header: cols.createdAt },
    ];
  }, [t]);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await adminApi.learningPaths());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [i.titleAr, i.titleEn, i.descriptionAr, String(i.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, statusFilter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((i) => i.status === 'ACTIVE').length,
    inactive: items.filter((i) => i.status === 'INACTIVE').length,
    courses: items.reduce((sum, i) => sum + Number(i._count?.courses || 0), 0),
  }), [items]);

  const statusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const label = statusLabels[i.status] || i.status;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [items, statusLabels]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    title: localizedPathTitle(row, i18n.language),
    courses: String(row._count?.courses ?? 0),
    status: statusLabels[row.status] || row.status,
    createdAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems, statusLabels, fmtDate, i18n.language]);

  const cols = t('admin.list.table.columns', { returnObjects: true }) as Record<string, string>;

  const openPath = (pathId: number) => {
    navigate(`/admin/learning-paths/${pathId}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteLearningPath(deleteTarget.id);
      showToast(t('admin.list.toast.deleted'), 'success');
      setDeleteTarget(null);
      await load();
    } catch {
      showToast(t('admin.list.toast.deleteError'), 'error');
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      t('admin.list.export.sheetName'),
      exportColumns,
      tableRows.map(({ _raw, title, ...row }) => ({ ...row, titleAr: title })),
    );
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title={t('admin.list.title')} subtitle={t('admin.list.subtitle')} />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            {t('actions.exportExcel')}
          </Button>
          <Link to="/admin/learning-paths/new">
            <Button type="button" icon={<Plus size={18} />}>
              {t('actions.newPath')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('admin.list.stats.total')} value={String(stats.total)} icon={FolderTree} />
        <StatCard title={t('admin.list.stats.active')} value={String(stats.active)} icon={Layers} />
        <StatCard title={t('admin.list.stats.inactive')} value={String(stats.inactive)} icon={Layers} />
        <StatCard title={t('admin.list.stats.totalCourses')} value={String(stats.courses)} icon={Layers} />
      </div>

      {statusChart.length ? (
        <div className="reports-charts-grid">
          <ReportChart title={t('admin.list.charts.statusDistribution')} type="pie" data={statusChart} />
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('admin.list.filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label={t('admin.list.filters.status')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: t('admin.list.filters.all'), value: '' },
            { label: statusLabels.ACTIVE, value: 'ACTIVE' },
            { label: statusLabels.INACTIVE, value: 'INACTIVE' },
          ]}
        />
      </FilterBar>

      <Card>
        <Table
          fluid
          hideScrollNotice
          loading={loading}
          data={tableRows}
          onRowClick={(row) => openPath(row._raw.id)}
          emptyTitle={t('admin.list.table.emptyTitle')}
          emptyDescription={t('admin.list.table.emptyDescription')}
          columns={[
            { key: 'id', header: cols.id, width: '4.5rem', align: 'center', className: 'col-id' },
            { key: 'title', header: cols.title, align: 'center', className: 'col-primary' },
            { key: 'courses', header: cols.courses, width: '5.5rem', align: 'center' },
            {
              key: 'status',
              header: cols.status,
              width: '7rem',
              align: 'center',
              truncate: false,
              render: (row) => <Badge variant={statusVariant(String(row._raw?.status))}>{row.status}</Badge>,
            },
            { key: 'createdAt', header: cols.createdAt, width: '9.5rem', align: 'center' },
            {
              key: 'actions',
              header: cols.actions,
              width: '18rem',
              align: 'end',
              truncate: false,
              render: (row) => (
                <>
                  <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openPath(row._raw.id); }}>
                    {t('actions.manageCourses')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openPath(row._raw.id); }}>
                    {t('actions.edit')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row._raw); }}>
                    {t('actions.delete')}
                  </Button>
                </>
              ),
            },
          ]}
        />
      </Card>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('admin.list.deleteTitle')}
        message={t('admin.list.deleteMessage')}
        confirmLabel={t('common:actions.delete')}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
