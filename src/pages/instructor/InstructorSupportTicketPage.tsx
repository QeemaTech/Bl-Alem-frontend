import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Send } from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { useAdminSupportLabels } from '../../hooks/useAdminSupportLabels';

export default function InstructorSupportTicketPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { getStatusLabel, getRoleLabel, fmtSupportDate, statusVariant } = useAdminSupportLabels();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      setTicket(await instructorApi.supportTicket(ticketId));
    } catch {
      showToast('تعذّر تحميل التذكرة.', 'error');
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
      showToast('تم إرسال الرد.', 'success');
      await load();
    } catch {
      showToast('تعذّر إرسال الرد.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (!ticket) {
    return (
      <div className="page-grid admin-support-ticket-page instructor-support-ticket-page">
        <EmptyState
          title="التذكرة غير موجودة"
          description="لم نتمكن من العثور على هذه التذكرة."
        />
        <Button variant="outline" onClick={() => navigate('/instructor/support')}>
          العودة للدعم الفني
        </Button>
      </div>
    );
  }

  return (
    <div className="page-grid admin-support-ticket-page instructor-support-ticket-page">
      <Link to="/instructor/support" className="support-ticket-back">
        <ArrowRight size={18} aria-hidden="true" />
        العودة لتذاكر الدعم
      </Link>

      <Card className="support-ticket-page-card">
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

          <div className="admin-entity-meta instructor-support-ticket-meta">
            <div className="admin-entity-meta-head">
              <span className="admin-entity-meta-head-icon" aria-hidden="true">
                <Send size={18} />
              </span>
              <h3>معلومات التذكرة</h3>
            </div>
            <div className="admin-entity-meta-grid">
              <div className="detail-row">
                <span className="detail-row-label">تاريخ الإنشاء</span>
                <span className="detail-row-value">{fmtSupportDate(ticket.createdAt)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-row-label">آخر تحديث</span>
                <span className="detail-row-value">{fmtSupportDate(ticket.updatedAt)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-row-label">عدد الردود</span>
                <span className="detail-row-value">{ticket.replies?.length ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="support-reply is-user">
            <small>أنت · {fmtSupportDate(ticket.createdAt)}</small>
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
                      {isAdmin ? 'فريق الدعم' : (item.user?.fullName || 'أنت')}
                      {item.user?.role ? ` (${getRoleLabel(item.user.role)})` : ''}
                      {' · '}
                      {fmtSupportDate(item.createdAt)}
                    </small>
                    <p>{item.message}</p>
                  </div>
                );
              })
            ) : (
              <p className="support-ticket-no-replies">لا توجد ردود بعد — سيتواصل معك فريق الدعم قريباً.</p>
            )}
          </div>

          {ticket.status !== 'CLOSED' ? (
            <form className="support-ticket-reply-form" onSubmit={sendReply}>
              <Textarea
                label="رد جديد"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="اكتب ردك أو أضف تفاصيل..."
                required
              />
              <div className="support-ticket-actions">
                <Button type="submit" loading={submitting} disabled={!reply.trim()} icon={<Send size={16} />}>
                  إرسال الرد
                </Button>
              </div>
            </form>
          ) : (
            <div className="support-ticket-closed-notice">
              <CheckCircle2 size={18} />
              <span>تم إغلاق هذه التذكرة. يمكنك فتح تذكرة جديدة إن احتجت مساعدة إضافية.</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
