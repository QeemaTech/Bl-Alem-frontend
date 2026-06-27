import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2, Download, Eye, Headphones, MessageSquare, MessageSquarePlus, Plus, Send, Table2, X,
} from '@/icons';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
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
  { key: 'subject', header: 'الموضوع' },
  { key: 'message', header: 'الرسالة' },
  { key: 'repliesCount', header: 'عدد الردود' },
  { key: 'status', header: 'الحالة' },
  { key: 'createdAt', header: 'تاريخ الإنشاء' },
  { key: 'updatedAt', header: 'آخر تحديث' },
];

export default function StudentSupportPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setTickets(await studentApi.supportTickets());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (statusFilter) result = result.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((t) =>
        [t.subject, t.message, String(t.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [tickets, statusFilter, search]);

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'OPEN').length,
    inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    closed: tickets.filter((t) => t.status === 'CLOSED').length,
  }), [tickets]);

  const tableRows = useMemo(() => filteredTickets.map((row) => ({
    id: row.id,
    subject: row.subject,
    message: row.message?.length > 50 ? `${row.message.slice(0, 50)}...` : row.message,
    repliesCount: row._count?.replies ?? row.replies?.length ?? 0,
    status: statusLabels[row.status] || row.status,
    createdAt: fmtDate(row.createdAt),
    updatedAt: fmtDate(row.updatedAt),
    _raw: row,
  })), [filteredTickets]);

  const openTicket = async (id: number) => {
    if (selected?.id === id) return;
    setDetailLoading(true);
    setSelected(null);
    try {
      setSelected(await studentApi.supportTicket(id));
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setReply('');
  };

  const createTicket = async (event: FormEvent) => {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      await studentApi.createSupportTicket({ subject: subject.trim(), message: message.trim() });
      setIsOpen(false);
      setSubject('');
      setMessage('');
      showToast('تم إنشاء التذكرة بنجاح.', 'success');
      await load();
    } catch {
      showToast('تعذّر إنشاء التذكرة.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    setSubmitting(true);
    try {
      await studentApi.replySupportTicket(selected.id, reply.trim());
      setReply('');
      showToast('تم إرسال الرد.', 'success');
      await load();
      setSelected(await studentApi.supportTicket(selected.id));
    } catch {
      showToast('تعذّر إرسال الرد.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      'تذاكر الدعم',
      exportColumns,
      tableRows.map(({ _raw, message: preview, ...row }) => ({
        ...row,
        message: _raw.message || preview,
      })),
    );
  };

  return (
    <div className="page-grid student-support-page">
      <div className="reports-header">
        <PageHeader
          title="الدعم الفني"
          subtitle="أنشئ تذكرة أو تابع ردود فريق الدعم"
        />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!tickets.length}>
            تصدير Excel
          </Button>
          <Button icon={<Plus size={18} />} onClick={() => setIsOpen(true)}>
            تذكرة جديدة
          </Button>
        </div>
      </div>

      <Card className="student-support-hero">
        <div className="student-support-hero-icon">
          <Headphones size={32} />
        </div>
        <div className="student-support-hero-body">
          <strong>نحن هنا لمساعدتك</strong>
          <p>أرسل استفسارك أو مشكلتك وسيرد عليك فريق الدعم في أقرب وقت.</p>
        </div>
      </Card>

      <div className="stats-grid">
        <StatCard title="إجمالي التذاكر" value={String(stats.total)} icon={Headphones} />
        <StatCard title="مفتوحة" value={String(stats.open)} icon={MessageSquarePlus} />
        <StatCard title="قيد المعالجة" value={String(stats.inProgress)} icon={MessageSquare} />
        <StatCard title="مغلقة" value={String(stats.closed)} icon={CheckCircle2} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالموضوع أو الرسالة..."
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
          <span className="muted-count">{filteredTickets.length.toLocaleString('ar-EG')} تذكرة</span>
        </div>
        <Table
          loading={loading}
          fluid
          hideScrollNotice
          data={tableRows}
          emptyTitle="لا توجد تذاكر"
          emptyDescription="أنشئ تذكرة عند احتياجك للمساعدة."
          columns={[
            { key: 'id', header: 'رقم التذكرة', align: 'center' },
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
                  variant={selected?.id === row._raw?.id ? 'primary' : 'outline'}
                  size="sm"
                  icon={<Eye size={16} />}
                  onClick={() => openTicket(row._raw.id)}
                >
                  عرض
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {(detailLoading || selected) ? (
        <Card className="student-support-detail-panel">
          {detailLoading ? (
            <EmptyState title="جاري التحميل..." description="يتم جلب تفاصيل التذكرة." />
          ) : selected ? (
            <>
              <div className="student-support-detail-header">
                <div>
                  <span className="admin-support-ticket-id">#{selected.id}</span>
                  <h2>{selected.subject}</h2>
                </div>
                <div className="student-support-detail-actions">
                  <Badge variant={statusVariant(selected.status)}>
                    {statusLabels[selected.status] || selected.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<X size={18} />}
                    onClick={closeDetail}
                    aria-label="إغلاق التفاصيل"
                  />
                </div>
              </div>

              <div className="support-reply user">
                <small>أنت · {fmtDate(selected.createdAt)}</small>
                <p>{selected.message}</p>
              </div>

              <div className="admin-support-thread">
                {selected.replies?.length ? (
                  selected.replies.map((item: any) => {
                    const isAdmin = item.user?.role === 'SUPER_ADMIN';
                    return (
                      <div
                        key={item.id}
                        className={`support-reply ${isAdmin ? 'admin' : 'user'}`}
                      >
                        <small>
                          {isAdmin ? 'فريق الدعم' : item.user?.fullName || 'أنت'}
                          {' · '}
                          {fmtDate(item.createdAt)}
                        </small>
                        <p>{item.message}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="admin-support-no-replies">لا توجد ردود بعد — سيتواصل معك فريق الدعم قريباً.</p>
                )}
              </div>

              {selected.status !== 'CLOSED' ? (
                <form className="stack-sm" onSubmit={sendReply}>
                  <Textarea
                    label="رد جديد"
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder="اكتب ردك أو أضف تفاصيل..."
                    required
                  />
                  <Button type="submit" loading={submitting} disabled={!reply.trim()} icon={<Send size={16} />}>
                    إرسال الرد
                  </Button>
                </form>
              ) : (
                <div className="admin-support-closed-notice">
                  <CheckCircle2 size={18} />
                  <span>تم إغلاق هذه التذكرة. يمكنك فتح تذكرة جديدة إن احتجت مساعدة إضافية.</span>
                </div>
              )}
            </>
          ) : null}
        </Card>
      ) : null}

      <Modal isOpen={isOpen} title="تذكرة دعم جديدة" onClose={() => setIsOpen(false)}>
        <form className="stack-sm" onSubmit={createTicket}>
          <Input
            label="الموضوع"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="مثال: مشكلة في الدفع أو الوصول للدورة"
            required
          />
          <Textarea
            label="الرسالة"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="اشرح مشكلتك أو استفسارك بالتفصيل..."
            required
          />
          <div className="card-actions">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>إلغاء</Button>
            <Button type="submit" loading={submitting} icon={<MessageSquarePlus size={16} />}>إرسال التذكرة</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
