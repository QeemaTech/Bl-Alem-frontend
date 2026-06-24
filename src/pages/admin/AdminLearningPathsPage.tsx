import { useEffect, useMemo, useState } from 'react';
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
import { exportTableToExcel } from '../../utils/exportExcel';

const statusLabels: Record<string, string> = {
  ACTIVE: 'فعّال',
  INACTIVE: 'غير فعّال',
};

const statusVariant = (status: string) => {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'INACTIVE') return 'warning' as const;
  return 'default' as const;
};

const fmtDate = (value?: string | null) => (value
  ? new Date(value).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
  : '—');

const exportColumns = [
  { key: 'id', header: 'رقم المسار' },
  { key: 'titleAr', header: 'عنوان المسار' },
  { key: 'courses', header: 'عدد الدورات' },
  { key: 'status', header: 'الحالة' },
  { key: 'createdAt', header: 'تاريخ الإنشاء' },
];

export default function AdminLearningPathsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

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
  }, [items]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    titleAr: row.titleAr,
    courses: String(row._count?.courses ?? 0),
    status: statusLabels[row.status] || row.status,
    createdAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems]);

  const openPath = (pathId: number) => {
    navigate(`/admin/learning-paths/${pathId}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteLearningPath(deleteTarget.id);
      showToast('تم حذف المسار.', 'success');
      setDeleteTarget(null);
      await load();
    } catch {
      showToast('تعذّر حذف المسار.', 'error');
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    exportTableToExcel('المسارات التعليمية', exportColumns, tableRows.map(({ _raw, ...row }) => row));
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title="المسارات التعليمية" subtitle="إدارة المسارات التعليمية وربط الدورات بها" />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
          <Link to="/admin/learning-paths/new">
            <Button type="button" icon={<Plus size={18} />}>
              مسار جديد
            </Button>
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي المسارات" value={String(stats.total)} icon={FolderTree} />
        <StatCard title="فعّالة" value={String(stats.active)} icon={Layers} />
        <StatCard title="غير فعّالة" value={String(stats.inactive)} icon={Layers} />
        <StatCard title="إجمالي الدورات" value={String(stats.courses)} icon={Layers} />
      </div>

      {statusChart.length ? (
        <div className="reports-charts-grid">
          <ReportChart title="توزيع حالات المسارات" type="pie" data={statusChart} />
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث باسم المسار أو الوصف..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label="الحالة"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'فعّال', value: 'ACTIVE' },
            { label: 'غير فعّال', value: 'INACTIVE' },
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
          emptyTitle="لا توجد مسارات"
          emptyDescription="ابدأ بإنشاء مسار تعليمي جديد."
          columns={[
            { key: 'id', header: 'الرقم', width: '4.5rem', align: 'center', className: 'col-id' },
            { key: 'titleAr', header: 'المسار', align: 'center', className: 'col-primary' },
            { key: 'courses', header: 'الدورات', width: '5.5rem', align: 'center' },
            {
              key: 'status',
              header: 'الحالة',
              width: '7rem',
              align: 'center',
              truncate: false,
              render: (row) => <Badge variant={statusVariant(String(row._raw?.status))}>{row.status}</Badge>,
            },
            { key: 'createdAt', header: 'التاريخ', width: '9.5rem', align: 'center' },
            {
              key: 'actions',
              header: 'الإجراءات',
              width: '18rem',
              align: 'end',
              truncate: false,
              render: (row) => (
                <>
                  <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openPath(row._raw.id); }}>
                    إدارة الدورات
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openPath(row._raw.id); }}>
                    تعديل
                  </Button>
                  <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row._raw); }}>
                    حذف
                  </Button>
                </>
              ),
            },
          ]}
        />
      </Card>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="حذف المسار"
        message="هل أنت متأكد من حذف هذا المسار؟ سيتم إزالة الربط مع الدورات."
        confirmLabel="حذف"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
