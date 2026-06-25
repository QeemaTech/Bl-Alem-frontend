import { FormEvent } from 'react';
import { CheckCircle2, XCircle } from '@/icons';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Textarea } from '../../ui/Textarea';
import { fmtSupportDate, roleLabels, statusLabels, statusVariant } from './supportTicketShared';

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
  return (
    <div className="support-ticket-detail">
      <div className="support-ticket-detail-header">
        <div>
          <span className="support-ticket-id">#{ticket.id}</span>
          <h2>{ticket.subject}</h2>
        </div>
        <Badge variant={statusVariant(ticket.status)}>
          {statusLabels[ticket.status]}
        </Badge>
      </div>

      <div className="support-ticket-user-card">
        <strong>{ticket.user?.fullName}</strong>
        <span>{ticket.user?.email}</span>
        <span>{roleLabels[ticket.user?.role] || ticket.user?.role}</span>
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
                {item.user?.fullName} ({roleLabels[item.user?.role] || item.user?.role}) · {fmtSupportDate(item.createdAt)}
              </small>
              <p>{item.message}</p>
            </div>
          ))
        ) : (
          <p className="support-ticket-no-replies">لا توجد ردود بعد.</p>
        )}
      </div>

      {ticket.status !== 'CLOSED' ? (
        <form className="support-ticket-reply-form" onSubmit={onSendReply}>
          <Textarea
            label="رد الدعم"
            value={reply}
            onChange={(e) => onReplyChange(e.target.value)}
            placeholder="اكتب ردك للمستخدم..."
            required
          />
          <div className="support-ticket-actions">
            <Button type="submit" loading={submitting} disabled={!reply.trim()}>
              إرسال الرد
            </Button>
            {ticket.status === 'OPEN' ? (
              <Button type="button" variant="outline" onClick={() => onUpdateStatus('IN_PROGRESS')} loading={submitting}>
                بدء المعالجة
              </Button>
            ) : null}
            <Button
              type="button"
              variant="danger"
              onClick={() => onUpdateStatus('CLOSED')}
              loading={submitting}
              icon={<XCircle size={16} />}
            >
              إغلاق التذكرة
            </Button>
          </div>
        </form>
      ) : (
        <div className="support-ticket-closed-notice">
          <CheckCircle2 size={18} />
          <span>تم إغلاق هذه التذكرة.</span>
          <Button variant="outline" size="sm" onClick={() => onUpdateStatus('OPEN')} loading={submitting}>
            إعادة فتح
          </Button>
        </div>
      )}
    </div>
  );
}
