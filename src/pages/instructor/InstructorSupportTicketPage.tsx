import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Send } from '@/icons';
import { instructorApi } from '../../api/instructor';
import { statusVariant } from '../../components/admin/support/supportTicketShared';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { formatDateTime } from '../../utils/localeFormat';

export default function InstructorSupportTicketPage() {
  const { t, i18n } = useTranslation('support');
  const lang = i18n.language;
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const statusLabel = useCallback(
    (status: string) => t(`instructor.labels.status.${status}`, { defaultValue: status }),
    [t, lang],
  );

  const roleLabel = useCallback(
    (role: string) => t(`instructor.labels.role.${role}`, { defaultValue: role }),
    [t, lang],
  );

  const fmtDate = useCallback(
    (value?: string | null) => (
      value
        ? formatDateTime(value, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }, lang)
        : ''
    ),
    [lang],
  );

  const load = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      setTicket(await instructorApi.supportTicket(ticketId));
    } catch {
      showToast(t('instructor.toast.loadFailed'), 'error');
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [ticketId]);

  const sendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!ticket || !reply.trim()) return;
    setSubmitting(true);
    try {
      await instructorApi.replySupportTicket(ticket.id, reply.trim());
      setReply('');
      showToast(t('instructor.toast.replySent'), 'success');
      await load();
    } catch {
      showToast(t('instructor.toast.replyFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (!ticket) {
    return (
      <div className="page-grid admin-support-ticket-page instructor-support-ticket-page">
        <EmptyState
          title={t('instructor.detail.notFoundTitle')}
          description={t('instructor.detail.notFoundDescription')}
        />
        <Button variant="outline" onClick={() => navigate('/instructor/support')}>
          {t('instructor.backToSupport')}
        </Button>
      </div>
    );
  }

  return (
    <div className="page-grid admin-support-ticket-page instructor-support-ticket-page">
      <Link to="/instructor/support" className="support-ticket-back">
        <ArrowRight size={18} aria-hidden="true" />
        {t('instructor.backToTickets')}
      </Link>

      <Card className="support-ticket-page-card">
        <div className="support-ticket-detail">
          <div className="support-ticket-detail-header">
            <div>
              <span className="support-ticket-id">#{ticket.id}</span>
              <h2>{ticket.subject}</h2>
            </div>
            <Badge variant={statusVariant(ticket.status)}>
              {statusLabel(ticket.status)}
            </Badge>
          </div>

          <div className="admin-entity-meta instructor-support-ticket-meta">
            <div className="admin-entity-meta-head">
              <span className="admin-entity-meta-head-icon" aria-hidden="true">
                <Send size={18} />
              </span>
              <h3>{t('instructor.detail.ticketInfo')}</h3>
            </div>
            <div className="admin-entity-meta-grid">
              <div className="detail-row">
                <span className="detail-row-label">{t('instructor.detail.createdAt')}</span>
                <span className="detail-row-value">{fmtDate(ticket.createdAt)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-row-label">{t('instructor.detail.lastUpdated')}</span>
                <span className="detail-row-value">{fmtDate(ticket.updatedAt)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-row-label">{t('instructor.detail.repliesCount')}</span>
                <span className="detail-row-value">{ticket.replies?.length ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="support-reply is-user">
            <small>{t('instructor.detail.you')} · {fmtDate(ticket.createdAt)}</small>
            <p>{ticket.message}</p>
          </div>

          <div className="support-ticket-thread">
            {ticket.replies?.length ? (
              ticket.replies.map((item: any) => {
                const isAdmin = item.user?.role === 'SUPER_ADMIN';
                return (
                  <div
                    key={item.id}
                    className={`support-reply ${isAdmin ? 'is-admin' : 'is-user'}`}
                  >
                    <small>
                      {isAdmin ? t('instructor.detail.supportTeam') : (item.user?.fullName || t('instructor.detail.you'))}
                      {item.user?.role ? ` (${roleLabel(item.user.role)})` : ''}
                      {' · '}
                      {fmtDate(item.createdAt)}
                    </small>
                    <p>{item.message}</p>
                  </div>
                );
              })
            ) : (
              <p className="support-ticket-no-replies">{t('instructor.detail.noReplies')}</p>
            )}
          </div>

          {ticket.status !== 'CLOSED' ? (
            <form className="support-ticket-reply-form" onSubmit={sendReply}>
              <Textarea
                label={t('instructor.detail.replyLabel')}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={t('instructor.detail.replyPlaceholder')}
                required
              />
              <div className="support-ticket-actions">
                <Button type="submit" loading={submitting} disabled={!reply.trim()} icon={<Send size={16} />}>
                  {t('instructor.detail.sendReply')}
                </Button>
              </div>
            </form>
          ) : (
            <div className="support-ticket-closed-notice">
              <CheckCircle2 size={18} />
              <span>{t('instructor.detail.closedNotice')}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
