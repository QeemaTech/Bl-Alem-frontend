import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2, Download, Headphones, MessageSquare, MessageSquarePlus, XCircle,
} from '@/icons';
import { adminApi } from '../../api/admin';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';

const statusLabels: Record<string, string> = {
  OPEN: 'مفتوحة',
  IN_PROGRESS: 'قيد المعالجة',
  CLOSED: 'مغلقة',
};

const roleLabels: Record<string, string> = {
  STUDENT: 'طالب',
  INSTRUCTOR: 'محاضر',
  SUPER_ADMIN: 'مشرف',
};

const statusVariant = (status: string) => {
  if (status === 'CLOSED') return 'success' as const;
  if (status === 'OPEN') return 'warning' as const;
  if (status === 'IN_PROGRESS') return 'info' as const;
  return 'default' as const;
};

const fmtDate = (value: string) => new Date(value).toLocaleDateString('ar-SA', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

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
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    createdAt: fmtDate(row.createdAt),
    updatedAt: fmtDate(row.updatedAt),
    _raw: row,
  })), [filteredItems]);

  const selectTicket = async (id: number) => {
    setDetailLoading(true);
    try {
      setSelected(await adminApi.supportTicket(id));
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await adminApi.supportStatus(selected.id, status);
      showToast('تم تحديث حالة التذكرة.', 'success');
      await load();
      setSelected(await adminApi.supportTicket(selected.id));
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected || !reply.trim()) return;
    setSubmitting(true);
    try {
      await adminApi.supportReply(selected.id, reply.trim());
      setReply('');
      showToast('تم إرسال الرد.', 'success');
      await load();
      setSelected(await adminApi.supportTicket(selected.id));
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="support-grid admin-support-grid">
      <section className="page-grid">
        <div className="reports-header">
          <PageHeader
            title="الدعم الفني"
            subtitle="إدارة تذاكر الدعم والرد على المستخدمين"
          />
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
        </div>

        <div className="stats-grid">
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

        <Card>
          <Table
            loading={loading}
            data={tableRows}
            emptyTitle="لا توجد تذاكر"
            emptyDescription="لم يتم إرسال أي تذاكر دعم بعد."
            columns={[
              { key: 'id', header: 'رقم التذكرة' },
              { key: 'user', header: 'المستخدم' },
              { key: 'role', header: 'الدور' },
              { key: 'subject', header: 'الموضوع' },
              { key: 'repliesCount', header: 'الردود' },
              {
                key: 'status',
                header: 'الحالة',
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
                    variant={selected?.id === row._raw?.id ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => selectTicket(row._raw.id)}
                  >
                    عرض
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </section>

      <aside className="card support-detail admin-support-detail">
        {detailLoading ? (
          <EmptyState title="جاري التحميل..." description="يتم جلب تفاصيل التذكرة." />
        ) : selected ? (
          <>
            <div className="admin-support-detail-header">
              <div>
                <span className="admin-support-ticket-id">#{selected.id}</span>
                <h2>{selected.subject}</h2>
              </div>
              <Badge variant={statusVariant(selected.status)}>
                {statusLabels[selected.status]}
              </Badge>
            </div>

            <div className="admin-support-user-card">
              <strong>{selected.user?.fullName}</strong>
              <span>{selected.user?.email}</span>
              <span>{roleLabels[selected.user?.role] || selected.user?.role}</span>
              {selected.user?.phone ? <span>{selected.user.phone}</span> : null}
            </div>

            <div className="support-reply user">
              <small>{selected.user?.fullName} · {fmtDate(selected.createdAt)}</small>
              <p>{selected.message}</p>
            </div>

            <div className="admin-support-thread">
              {selected.replies?.length ? (
                selected.replies.map((item: any) => (
                  <div
                    key={item.id}
                    className={`support-reply ${item.user?.role === 'SUPER_ADMIN' ? 'admin' : 'user'}`}
                  >
                    <small>
                      {item.user?.fullName} ({roleLabels[item.user?.role] || item.user?.role}) · {fmtDate(item.createdAt)}
                    </small>
                    <p>{item.message}</p>
                  </div>
                ))
              ) : (
                <p className="admin-support-no-replies">لا توجد ردود بعد.</p>
              )}
            </div>

            {selected.status !== 'CLOSED' ? (
              <form className="stack-sm" onSubmit={sendReply}>
                <Textarea
                  label="رد الدعم"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="اكتب ردك للمستخدم..."
                  required
                />
                <div className="card-actions">
                  <Button type="submit" loading={submitting} disabled={!reply.trim()}>
                    إرسال الرد
                  </Button>
                  {selected.status === 'OPEN' ? (
                    <Button type="button" variant="outline" onClick={() => updateStatus('IN_PROGRESS')} loading={submitting}>
                      بدء المعالجة
                    </Button>
                  ) : null}
                  <Button type="button" variant="danger" onClick={() => updateStatus('CLOSED')} loading={submitting} icon={<XCircle size={16} />}>
                    إغلاق التذكرة
                  </Button>
                </div>
              </form>
            ) : (
              <div className="admin-support-closed-notice">
                <CheckCircle2 size={18} />
                <span>تم إغلاق هذه التذكرة.</span>
                <Button variant="outline" size="sm" onClick={() => updateStatus('OPEN')} loading={submitting}>
                  إعادة فتح
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="اختر تذكرة"
            description="اضغط «عرض» لمراجعة التفاصيل والرد على المستخدم."
            icon={Headphones}
          />
        )}
      </aside>
    </div>
  );
}
