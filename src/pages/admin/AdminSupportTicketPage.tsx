import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('support');
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
      showToast(t('admin.toast.loadFailed'), 'error');
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
      showToast(t('admin.toast.statusUpdated'), 'success');
      await load();
    } catch {
      showToast(t('admin.toast.statusUpdateFailed'), 'error');
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
      showToast(t('admin.toast.replySent'), 'success');
      await load();
    } catch {
      showToast(t('admin.toast.replyFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (!ticket) {
    return (
      <div className="page-grid admin-support-ticket-page">
        <EmptyState
          title={t('admin.detail.notFoundTitle')}
          description={t('admin.detail.notFoundDescription')}
        />
        <Button variant="outline" onClick={() => navigate('/admin/support')}>
          {t('admin.backToSupport')}
        </Button>
      </div>
    );
  }

  return (
    <div className="page-grid admin-support-ticket-page">
      <Link to="/admin/support" className="support-ticket-back">
        <ArrowRight size={18} aria-hidden="true" />
        {t('admin.backToList')}
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
