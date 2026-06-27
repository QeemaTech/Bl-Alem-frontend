import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ChevronLeft, Headphones, MessageSquare, MessageSquarePlus, Plus, Table2,
} from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FilterBar } from '../../components/ui/FilterBar';
import { Input } from '../../components/ui/Input';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { useAdminSupportLabels } from '../../hooks/useAdminSupportLabels';

export default function InstructorSupportPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { getStatusLabel, fmtSupportDate, statusLabels, statusVariant } = useAdminSupportLabels();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setTickets(await instructorApi.supportTickets());
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
    message: row.message?.length > 60 ? `${row.message.slice(0, 60)}…` : row.message,
    repliesCount: row._count?.replies ?? row.replies?.length ?? 0,
    status: getStatusLabel(row.status),
    createdAt: fmtSupportDate(row.createdAt),
    updatedAt: fmtSupportDate(row.updatedAt),
    _raw: row,
  })), [filteredTickets, getStatusLabel, fmtSupportDate]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      await instructorApi.createSupportTicket({ subject: subject.trim(), message: message.trim() });
      setOpen(false);
      setSubject('');
      setMessage('');
      showToast('تم إنشاء التذكرة.', 'success');
      await load();
    } catch {
      showToast('تعذّر إنشاء التذكرة.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !tickets.length) return <DashboardSkeleton />;

  return (
    <div className="page-grid instructor-support-page">
      <div className="reports-header instructor-support-header">
        <PageHeader
          title="الدعم الفني"
          subtitle="تواصل مع إدارة المنصة للحصول على المساعدة"
        />
        <div className="reports-header-actions">
          <Button icon={<Plus size={18} />} onClick={() => setOpen(true)}>
            تذكرة جديدة
          </Button>
        </div>
      </div>

      <Card className="student-support-hero instructor-support-hero">
        <div className="student-support-hero-icon">
          <Headphones size={32} />
        </div>
        <div className="student-support-hero-body">
          <strong>فريق الدعم جاهز لمساعدتك</strong>
          <p>أرسل استفسارك حول مراجعة الدورات، المدفوعات، أو أي مشكلة تقنية وسنرد عليك في أقرب وقت.</p>
        </div>
      </Card>

      <div className="stats-grid instructor-support-stats">
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

      <Card className="reports-table-card instructor-support-table-card">
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
          emptyDescription="أنشئ تذكرة للحصول على دعم من الإدارة."
          onRowClick={(row) => navigate(`/instructor/support/${row._raw.id}`)}
          columns={[
            { key: 'id', header: 'رقم التذكرة', align: 'center' },
            { key: 'subject', header: 'الموضوع' },
            { key: 'message', header: 'الرسالة' },
            { key: 'repliesCount', header: 'الردود', align: 'center' },
            {
              key: 'status',
              header: 'الحالة',
              align: 'center',
              render: (row) => (
                <Badge variant={statusVariant(String(row._raw?.status))}>
                  {getStatusLabel(String(row._raw?.status))}
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
                  icon={<ChevronLeft size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/instructor/support/${row._raw.id}`);
                  }}
                >
                  التفاصيل
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal isOpen={open} title="تذكرة دعم جديدة" onClose={() => setOpen(false)}>
        <form className="stack-sm" onSubmit={create}>
          <Input
            label="الموضوع"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="مثال: تأخير في مراجعة الكورس"
            required
          />
          <Textarea
            label="الرسالة"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اشرح مشكلتك أو استفسارك بالتفصيل..."
            required
          />
          <div className="card-actions">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button type="submit" loading={submitting} icon={<MessageSquarePlus size={16} />}>
              إرسال التذكرة
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
