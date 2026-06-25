import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Download, Eye, Headphones, MessageSquare, MessageSquarePlus, Table2,
} from '@/icons';
import { adminApi } from '../../api/admin';
import {
  fmtSupportDate,
  roleLabels,
  statusLabels,
  statusVariant,
} from '../../components/admin/support/supportTicketShared';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { exportTableToExcel } from '../../utils/exportExcel';

const exportColumns = [
  { key: 'id', header: 'رقم التذكرة' },
  { key: 'user', header: 'المستخدم' },
  { key: 'email', header: 'البريد' },
  { key: 'role', header: 'الدور' },
  { key: 'subject', header: 'الموضوع' },
  { key: 'message', header: 'الرسالة' },
  { key: 'repliesCount', header: 'عدد الردود' },
  { key: 'status', header: 'الحالة' },
  { key: 'createdAt', header: 'تاريخ الإنشاء' },
  { key: 'updatedAt', header: 'آخر تحديث' },
];

export default function AdminSupportPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
    role: roleLabels[row.user?.role] || row.user?.role || '—',
    subject: row.subject,
    message: row.message?.length > 60 ? `${row.message.slice(0, 60)}...` : row.message,
    repliesCount: row._count?.replies ?? 0,
    status: statusLabels[row.status] || row.status,
    createdAt: fmtSupportDate(row.createdAt),
    updatedAt: fmtSupportDate(row.updatedAt),
    _raw: row,
  })), [filteredItems]);

  const handleExport = () => {
    exportTableToExcel(
      'تذاكر الدعم',
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
          title="الدعم الفني"
          subtitle="إدارة تذاكر الدعم والرد على المستخدمين"
        />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
        </div>
      </div>

      <div className="stats-grid admin-support-stats">
        <StatCard title="إجمالي التذاكر" value={String(stats.total)} icon={Headphones} />
        <StatCard title="مفتوحة" value={String(stats.open)} icon={MessageSquarePlus} />
        <StatCard title="قيد المعالجة" value={String(stats.inProgress)} icon={MessageSquare} />
        <StatCard title="مغلقة" value={String(stats.closed)} icon={CheckCircle2} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالموضوع، الرسالة، المستخدم، أو البريد..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label="الحالة"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'كل الحالات', value: '' },
            { label: 'مفتوحة', value: 'OPEN' },
            { label: 'قيد المعالجة', value: 'IN_PROGRESS' },
            { label: 'مغلقة', value: 'CLOSED' },
          ]}
        />
      </FilterBar>

      <Card className="reports-table-card">
        <div className="section-heading reports-table-head">
          <h2>
            <span className="reports-table-title-icon" aria-hidden="true">
              <Table2 size={20} />
            </span>
            تذاكر الدعم
          </h2>
          <span className="muted-count">{filteredItems.length.toLocaleString('ar-EG')} تذكرة</span>
        </div>
        <Table
          loading={loading}
          fluid
          hideScrollNotice
          data={tableRows}
          emptyTitle="لا توجد تذاكر"
          emptyDescription="لم يتم إرسال أي تذاكر دعم بعد."
          columns={[
            { key: 'id', header: 'رقم التذكرة', align: 'center' },
            { key: 'user', header: 'المستخدم' },
            { key: 'role', header: 'الدور' },
            { key: 'subject', header: 'الموضوع' },
            { key: 'repliesCount', header: 'الردود', align: 'center' },
            {
              key: 'status',
              header: 'الحالة',
              align: 'center',
              render: (row) => (
                <Badge variant={statusVariant(String(row._raw?.status))}>
                  {statusLabels[String(row._raw?.status)] || row.status}
                </Badge>
              ),
            },
            { key: 'createdAt', header: 'التاريخ' },
            {
              key: 'actions',
              header: 'الإجراءات',
              render: (row) => (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Eye size={16} />}
                  onClick={() => navigate(`/admin/support/${row._raw.id}`)}
                >
                  عرض
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
