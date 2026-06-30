import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2, Download, Eye, Headphones, MessageSquare, MessageSquarePlus, Plus, Send, Table2, X,
} from '@/icons';
import { studentApi } from '../../api/student';
import { SupportFaqSection } from '../../components/support/SupportFaqSection';
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
import { formatDateTime } from '../../utils/localeFormat';

const statusVariant = (status: string) => {
  if (status === 'CLOSED') return 'success' as const;
  if (status === 'OPEN') return 'warning' as const;
  if (status === 'IN_PROGRESS') return 'info' as const;
  return 'default' as const;
};

export default function StudentSupportPage() {
  const { t, i18n } = useTranslation('support');
  const lang = i18n.language;
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
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(true);

  const statusLabel = useCallback(
    (status: string) => t(`student.labels.status.${status}`, { defaultValue: status }),
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
      setTickets(await studentApi.supportTickets());
    } finally {
      setLoading(false);
    }
  };

  const loadFaqs = async () => {
    setFaqsLoading(true);
    try {
      setFaqs(await studentApi.supportFaqs());
    } finally {
      setFaqsLoading(false);
    }
  };

  useEffect(() => { load(); loadFaqs(); }, []);

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

  const exportColumns = useMemo(() => [
    { key: 'id', header: t('student.export.columns.id') },
    { key: 'subject', header: t('student.export.columns.subject') },
    { key: 'message', header: t('student.export.columns.message') },
    { key: 'repliesCount', header: t('student.export.columns.repliesCount') },
    { key: 'status', header: t('student.export.columns.status') },
    { key: 'createdAt', header: t('student.export.columns.createdAt') },
    { key: 'updatedAt', header: t('student.export.columns.updatedAt') },
  ], [t, lang]);

  const tableRows = useMemo(() => filteredTickets.map((row) => ({
    id: row.id,
    subject: row.subject,
    message: row.message?.length > 50 ? `${row.message.slice(0, 50)}...` : row.message,
    repliesCount: row._count?.replies ?? row.replies?.length ?? 0,
    status: statusLabel(row.status),
    createdAt: fmtDate(row.createdAt),
    updatedAt: fmtDate(row.updatedAt),
    _raw: row,
  })), [filteredTickets, statusLabel, fmtDate]);

  const statusFilterOptions = useMemo(() => [
    { label: t('student.filters.allStatuses'), value: '' },
    { label: statusLabel('OPEN'), value: 'OPEN' },
    { label: statusLabel('IN_PROGRESS'), value: 'IN_PROGRESS' },
    { label: statusLabel('CLOSED'), value: 'CLOSED' },
  ], [t, statusLabel, lang]);

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
      showToast(t('student.toast.created'), 'success');
      await load();
    } catch {
      showToast(t('student.toast.createFailed'), 'error');
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
      showToast(t('student.toast.replySent'), 'success');
      await load();
      setSelected(await studentApi.supportTicket(selected.id));
    } catch {
      showToast(t('student.toast.replyFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      t('student.export.sheetName'),
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
          title={t('student.title')}
          subtitle={t('student.subtitle')}
        />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!tickets.length}>
            {t('student.exportExcel')}
          </Button>
          <Button icon={<Plus size={18} />} onClick={() => setIsOpen(true)}>
            {t('student.newTicket')}
          </Button>
        </div>
      </div>

      <Card className="student-support-hero">
        <div className="student-support-hero-icon">
          <Headphones size={32} />
        </div>
        <div className="student-support-hero-body">
          <strong>{t('student.heroTitle')}</strong>
          <p>{t('student.heroDesc')}</p>
        </div>
      </Card>

      <div className="stats-grid">
        <StatCard title={t('student.stats.total')} value={String(stats.total)} icon={Headphones} />
        <StatCard title={t('student.stats.open')} value={String(stats.open)} icon={MessageSquarePlus} />
        <StatCard title={t('student.stats.inProgress')} value={String(stats.inProgress)} icon={MessageSquare} />
        <StatCard title={t('student.stats.closed')} value={String(stats.closed)} icon={CheckCircle2} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('student.filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label={t('student.filters.status')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusFilterOptions}
        />
      </FilterBar>

      <Card className="reports-table-card">
        <div className="section-heading reports-table-head">
          <h2>
            <span className="reports-table-title-icon" aria-hidden="true">
              <Table2 size={20} />
            </span>
            {t('student.table.title')}
          </h2>
          <span className="muted-count">
            {t('student.table.ticketCount', { count: filteredTickets.length })}
          </span>
        </div>
        <Table
          loading={loading}
          fluid
          hideScrollNotice
          data={tableRows}
          emptyTitle={t('student.table.emptyTitle')}
          emptyDescription={t('student.table.emptyDescription')}
          columns={[
            { key: 'id', header: t('student.table.columns.id'), align: 'center' },
            { key: 'subject', header: t('student.table.columns.subject') },
            { key: 'repliesCount', header: t('student.table.columns.replies'), align: 'center' },
            {
              key: 'status',
              header: t('student.table.columns.status'),
              align: 'center',
              render: (row) => (
                <Badge variant={statusVariant(String(row._raw?.status))}>
                  {statusLabel(String(row._raw?.status))}
                </Badge>
              ),
            },
            { key: 'createdAt', header: t('student.table.columns.date') },
            {
              key: 'actions',
              header: t('student.table.columns.actions'),
              render: (row) => (
                <Button
                  variant={selected?.id === row._raw?.id ? 'primary' : 'outline'}
                  size="sm"
                  icon={<Eye size={16} />}
                  onClick={() => openTicket(row._raw.id)}
                >
                  {t('student.actions.view')}
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {(detailLoading || selected) ? (
        <Card className="student-support-detail-panel">
          {detailLoading ? (
            <EmptyState title={t('student.detail.loadingTitle')} description={t('student.detail.loadingDesc')} />
          ) : selected ? (
            <>
              <div className="student-support-detail-header">
                <div>
                  <span className="admin-support-ticket-id">#{selected.id}</span>
                  <h2>{selected.subject}</h2>
                </div>
                <div className="student-support-detail-actions">
                  <Badge variant={statusVariant(selected.status)}>
                    {statusLabel(selected.status)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<X size={18} />}
                    onClick={closeDetail}
                    aria-label={t('student.actions.closeDetail')}
                  />
                </div>
              </div>

              <div className="support-reply user">
                <small>{t('student.detail.you')} · {fmtDate(selected.createdAt)}</small>
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
                          {isAdmin ? t('student.detail.supportTeam') : item.user?.fullName || t('student.detail.you')}
                          {' · '}
                          {fmtDate(item.createdAt)}
                        </small>
                        <p>{item.message}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="admin-support-no-replies">{t('student.detail.noReplies')}</p>
                )}
              </div>

              {selected.status !== 'CLOSED' ? (
                <form className="stack-sm" onSubmit={sendReply}>
                  <Textarea
                    label={t('student.detail.replyLabel')}
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder={t('student.detail.replyPlaceholder')}
                    required
                  />
                  <Button type="submit" loading={submitting} disabled={!reply.trim()} icon={<Send size={16} />}>
                    {t('student.detail.sendReply')}
                  </Button>
                </form>
              ) : (
                <div className="admin-support-closed-notice">
                  <CheckCircle2 size={18} />
                  <span>{t('student.detail.closedNotice')}</span>
                </div>
              )}
            </>
          ) : null}
        </Card>
      ) : null}

      <SupportFaqSection
        items={faqs}
        loading={faqsLoading}
        onNeedHelp={() => setIsOpen(true)}
      />

      <Modal isOpen={isOpen} title={t('student.modal.title')} onClose={() => setIsOpen(false)}>
        <form className="stack-sm" onSubmit={createTicket}>
          <Input
            label={t('student.modal.subject')}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder={t('student.modal.subjectPlaceholder')}
            required
          />
          <Textarea
            label={t('student.modal.message')}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={t('student.modal.messagePlaceholder')}
            required
          />
          <div className="card-actions">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>{t('student.modal.cancel')}</Button>
            <Button type="submit" loading={submitting} icon={<MessageSquarePlus size={16} />}>{t('student.modal.submit')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
