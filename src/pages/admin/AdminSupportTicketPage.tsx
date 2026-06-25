import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from '@/icons';
import { adminApi } from '../../api/admin';
import { SupportTicketDetail } from '../../components/admin/support/SupportTicketDetail';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';

export default function AdminSupportTicketPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      setTicket(await adminApi.supportTicket(ticketId));
    } catch {
      showToast('تعذّر تحميل التذكرة.', 'error');
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [ticketId]);

  const updateStatus = async (status: string) => {
    if (!ticket) return;
    setSubmitting(true);
    try {
      await adminApi.supportStatus(ticket.id, status);
      showToast('تم تحديث حالة التذكرة.', 'success');
      await load();
    } catch {
      showToast('تعذّر تحديث الحالة.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!ticket || !reply.trim()) return;
    setSubmitting(true);
    try {
      await adminApi.supportReply(ticket.id, reply.trim());
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
      <div className="page-grid admin-support-ticket-page">
        <EmptyState
          title="التذكرة غير موجودة"
          description="لم نتمكن من العثور على هذه التذكرة."
        />
        <Button variant="outline" onClick={() => navigate('/admin/support')}>
          العودة للدعم الفني
        </Button>
      </div>
    );
  }

  return (
    <div className="page-grid admin-support-ticket-page">
      <Link to="/admin/support" className="support-ticket-back">
        <ArrowRight size={18} aria-hidden="true" />
        العودة لتذاكر الدعم
      </Link>

      <Card className="support-ticket-page-card">
        <SupportTicketDetail
          ticket={ticket}
          reply={reply}
          submitting={submitting}
          onReplyChange={setReply}
          onSendReply={sendReply}
          onUpdateStatus={updateStatus}
        />
      </Card>
    </div>
  );
}
