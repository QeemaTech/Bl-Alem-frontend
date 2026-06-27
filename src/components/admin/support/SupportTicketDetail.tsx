import { FormEvent } from 'react';
import { useAdminSupportLabels } from '../../../hooks/useAdminSupportLabels';
import { CheckCircle2, XCircle } from '@/icons';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Textarea } from '../../ui/Textarea';

interface SupportTicketDetailProps {
  ticket: any;
  reply: string;
  submitting: boolean;
  onReplyChange: (value: string) => void;
  onSendReply: (event: FormEvent) => void;
  onUpdateStatus: (status: string) => void;
}

export function SupportTicketDetail({
  ticket,
  reply,
  submitting,
  onReplyChange,
  onSendReply,
  onUpdateStatus,
}: SupportTicketDetailProps) {
  const { t } = useTranslation('support');
  const {
    getStatusLabel,
    getRoleLabel,
    fmtSupportDate,
    statusVariant,
  } = useAdminSupportLabels();

  return (
    <div className="support-ticket-detail">
      <div className="support-ticket-detail-header">
        <div>
          <span className="support-ticket-id">#{ticket.id}</span>
          <h2>{ticket.subject}</h2>
        </div>
        <Badge variant={statusVariant(ticket.status)}>
          {getStatusLabel(ticket.status)}
        </Badge>
      </div>

      <div className="support-ticket-user-card">
        <strong>{ticket.user?.fullName}</strong>
        <span>{ticket.user?.email}</span>
        <span>{getRoleLabel(ticket.user?.role) || ticket.user?.role}</span>
        {ticket.user?.phone ? <span>{ticket.user.phone}</span> : null}
      </div>

      <div className="support-reply is-user">
        <small>{ticket.user?.fullName} · {fmtSupportDate(ticket.createdAt)}</small>
        <p>{ticket.message}</p>
      </div>

      <div className="support-ticket-thread">
        {ticket.replies?.length ? (
          ticket.replies.map((item: any) => (
            <div
              key={item.id}
              className={`support-reply ${item.user?.role === 'SUPER_ADMIN' ? 'is-admin' : 'is-user'}`}
            >
              <small>
                {item.user?.fullName} ({getRoleLabel(item.user?.role) || item.user?.role}) · {fmtSupportDate(item.createdAt)}
              </small>
              <p>{item.message}</p>
            </div>
          ))
        ) : (
          <p className="support-ticket-no-replies">{t('admin.detail.noReplies')}</p>
        )}
      </div>

      {ticket.status !== 'CLOSED' ? (
        <form className="support-ticket-reply-form" onSubmit={onSendReply}>
          <Textarea
            label={t('admin.detail.replyLabel')}
            value={reply}
            onChange={(e) => onReplyChange(e.target.value)}
            placeholder={t('admin.detail.replyPlaceholder')}
            required
          />
          <div className="support-ticket-actions">
            <Button type="submit" loading={submitting} disabled={!reply.trim()}>
              {t('admin.detail.sendReply')}
            </Button>
            {ticket.status === 'OPEN' ? (
              <Button type="button" variant="outline" onClick={() => onUpdateStatus('IN_PROGRESS')} loading={submitting}>
                {t('admin.detail.startProcessing')}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="danger"
              onClick={() => onUpdateStatus('CLOSED')}
              loading={submitting}
              icon={<XCircle size={16} />}
            >
              {t('admin.detail.closeTicket')}
            </Button>
          </div>
        </form>
      ) : (
        <div className="support-ticket-closed-notice">
          <CheckCircle2 size={18} />
          <span>{t('admin.detail.closedNotice')}</span>
          <Button variant="outline" size="sm" onClick={() => onUpdateStatus('OPEN')} loading={submitting}>
            {t('admin.detail.reopen')}
          </Button>
        </div>
      )}
    </div>
  );
}
