import { FormEvent, useEffect, useState } from 'react';
import { MessageSquare } from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';

const ticketVariant = (status: string) => {
  if (status === 'OPEN') return 'warning' as const;
  if (status === 'CLOSED') return 'success' as const;
  return 'default' as const;
};

export default function InstructorSupportPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');

  const load = () => instructorApi.supportTickets().then(setTickets);
  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []);

  const select = async (id: number) => setSelected(await instructorApi.supportTicket(id));
  const create = async (e: FormEvent) => {
    e.preventDefault();
    await instructorApi.createSupportTicket({ subject, message });
    setOpen(false);
    setSubject('');
    setMessage('');
    showToast('تم إنشاء التذكرة.', 'success');
    load();
  };
  const sendReply = async () => {
    if (!selected || !reply) return;
    await instructorApi.replySupportTicket(selected.id, reply);
    setReply('');
    setSelected(await instructorApi.supportTicket(selected.id));
  };

  return (
    <div className="support-grid">
      <section className="page-grid">
        <PageHeader
          title="الدعم الفني"
          subtitle="تواصل مع إدارة المنصة للحصول على المساعدة"
          action={<Button onClick={() => setOpen(true)}>تذكرة جديدة</Button>}
        />
        {loading ? (
          <LoadingSkeleton variant="row" count={4} />
        ) : tickets.length ? (
          <Card>
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="session-card ticket-card"
                onClick={() => select(ticket.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && select(ticket.id)}
              >
                <div className="session-card-info">
                  <h4><MessageSquare size={16} /> {ticket.subject}</h4>
                  <p>{ticket.message}</p>
                </div>
                <Badge variant={ticketVariant(ticket.status)}>{ticket.status}</Badge>
              </div>
            ))}
          </Card>
        ) : (
          <Card>
            <EmptyState
              title="لا توجد تذاكر"
              description="أنشئ تذكرة للحصول على دعم من الإدارة."
              icon={MessageSquare}
            />
          </Card>
        )}
      </section>
      <aside className="card support-detail">
        {selected ? (
          <>
            <h2>{selected.subject}</h2>
            <p>{selected.message}</p>
            {selected.replies?.map((r: any) => (
              <Card key={r.id}>
                <strong>{r.user?.fullName}</strong>
                <p>{r.message}</p>
              </Card>
            ))}
            <Textarea label="رد" value={reply} onChange={(e) => setReply(e.target.value)} />
            <Button onClick={sendReply}>إرسال</Button>
          </>
        ) : (
          <EmptyState title="اختر تذكرة" description="تفاصيل التذكرة تظهر هنا." />
        )}
      </aside>
      <Modal isOpen={open} title="تذكرة جديدة" onClose={() => setOpen(false)}>
        <form className="stack-sm" onSubmit={create}>
          <Input label="الموضوع" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Textarea label="الرسالة" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button>إرسال</Button>
        </form>
      </Modal>
    </div>
  );
}
