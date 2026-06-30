import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ChevronLeft, Headphones, MessageSquare, MessageSquarePlus, Plus, Table2,
} from '@/icons';
import { instructorApi } from '../../api/instructor';
import { SupportFaqSection } from '../../components/support/SupportFaqSection';
import { statusVariant } from '../../components/admin/support/supportTicketShared';
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
import { formatDateTime } from '../../utils/localeFormat';

export default function InstructorSupportPage() {
  const { t, i18n } = useTranslation('support');
  const lang = i18n.language;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(true);

  const statusLabel = useCallback(
    (status: string) => t(`instructor.labels.status.${status}`, { defaultValue: status }),
    [t, lang],
  );

  const fmtDate = useCallback(
    (value: string) => formatDateTime(
      value,
      { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
      lang,
    ),
    [lang],
  );

  const load = async () => {
    setLoading(true);
    try {
      setTickets(await instructorApi.supportTickets());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    instructorApi.supportFaqs()
      .then(setFaqs)
      .finally(() => setFaqsLoading(false));
  }, []);

  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (statusFilter) result = result.filter((item) => item.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((item) =>
        [item.subject, item.message, String(item.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [tickets, statusFilter, search]);

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((item) => item.status === 'OPEN').length,
    inProgress: tickets.filter((item) => item.status === 'IN_PROGRESS').length,
    closed: tickets.filter((item) => item.status === 'CLOSED').length,
  }), [tickets]);

  const statusFilterOptions = useMemo(() => [
    { label: t('instructor.filters.allStatuses'), value: '' },
    { label: statusLabel('OPEN'), value: 'OPEN' },
    { label: statusLabel('IN_PROGRESS'), value: 'IN_PROGRESS' },
    { label: statusLabel('CLOSED'), value: 'CLOSED' },
  ], [t, statusLabel, lang]);

  const tableRows = useMemo(() => filteredTickets.map((row) => ({
    id: row.id,
    subject: row.subject,
    message: row.message?.length > 60 ? `${row.message.slice(0, 60)}…` : row.message,
    repliesCount: row._count?.replies ?? row.replies?.length ?? 0,
    status: statusLabel(row.status),
    createdAt: fmtDate(row.createdAt),
    updatedAt: fmtDate(row.updatedAt),
    _raw: row,
  })), [filteredTickets, statusLabel, fmtDate]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      await instructorApi.createSupportTicket({ subject: subject.trim(), message: message.trim() });
      setOpen(false);
      setSubject('');
      setMessage('');
      showToast(t('instructor.toast.created'), 'success');
      await load();
    } catch {
      showToast(t('instructor.toast.createFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !tickets.length) return <DashboardSkeleton />;

  return (
    <div className="page-grid instructor-support-page">
      <div className="reports-header instructor-support-header">
        <PageHeader
          title={t('instructor.title')}
          subtitle={t('instructor.subtitle')}
        />
        <div className="reports-header-actions">
          <Button icon={<Plus size={18} />} onClick={() => setOpen(true)}>
            {t('instructor.newTicket')}
          </Button>
        </div>
      </div>

      <Card className="student-support-hero instructor-support-hero">
        <div className="student-support-hero-icon">
          <Headphones size={32} />
        </div>
        <div className="student-support-hero-body">
          <strong>{t('instructor.heroTitle')}</strong>
          <p>{t('instructor.heroDesc')}</p>
        </div>
      </Card>

      <div className="stats-grid instructor-support-stats">
        <StatCard title={t('instructor.stats.total')} value={String(stats.total)} icon={Headphones} />
        <StatCard title={t('instructor.stats.open')} value={String(stats.open)} icon={MessageSquarePlus} />
        <StatCard title={t('instructor.stats.inProgress')} value={String(stats.inProgress)} icon={MessageSquare} />
        <StatCard title={t('instructor.stats.closed')} value={String(stats.closed)} icon={CheckCircle2} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('instructor.filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label={t('instructor.filters.status')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusFilterOptions}
        />
      </FilterBar>

      <Card className="reports-table-card instructor-support-table-card">
        <div className="section-heading reports-table-head">
          <h2>
            <span className="reports-table-title-icon" aria-hidden="true">
              <Table2 size={20} />
            </span>
            {t('instructor.table.title')}
          </h2>
          <span className="muted-count">
            {t('instructor.table.ticketCount', { count: filteredTickets.length })}
          </span>
        </div>
        <Table
          loading={loading}
          fluid
          hideScrollNotice
          data={tableRows}
          emptyTitle={t('instructor.table.emptyTitle')}
          emptyDescription={t('instructor.table.emptyDescription')}
          onRowClick={(row) => navigate(`/instructor/support/${row._raw.id}`)}
          columns={[
            { key: 'id', header: t('instructor.table.columns.id'), align: 'center' },
            { key: 'subject', header: t('instructor.table.columns.subject') },
            { key: 'message', header: t('instructor.table.columns.message') },
            { key: 'repliesCount', header: t('instructor.table.columns.replies'), align: 'center' },
            {
              key: 'status',
              header: t('instructor.table.columns.status'),
              align: 'center',
              render: (row) => (
                <Badge variant={statusVariant(String(row._raw?.status))}>
                  {statusLabel(String(row._raw?.status))}
                </Badge>
              ),
            },
            { key: 'createdAt', header: t('instructor.table.columns.date') },
            {
              key: 'actions',
              header: t('instructor.table.columns.actions'),
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
                  {t('instructor.actions.details')}
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <SupportFaqSection
        items={faqs}
        loading={faqsLoading}
        onNeedHelp={() => setOpen(true)}
      />

      <Modal isOpen={open} title={t('instructor.modal.title')} onClose={() => setOpen(false)}>
        <form className="stack-sm" onSubmit={create}>
          <Input
            label={t('instructor.modal.subject')}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('instructor.modal.subjectPlaceholder')}
            required
          />
          <Textarea
            label={t('instructor.modal.message')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('instructor.modal.messagePlaceholder')}
            required
          />
          <div className="card-actions">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{t('instructor.modal.cancel')}</Button>
            <Button type="submit" loading={submitting} icon={<MessageSquarePlus size={16} />}>
              {t('instructor.modal.submit')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
