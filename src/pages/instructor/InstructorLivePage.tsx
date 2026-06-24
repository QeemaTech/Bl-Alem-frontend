import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Calendar, Clock, Copy, Download, ExternalLink, Plus, Radio, Video,
} from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Tabs } from '../../components/ui/Tabs';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';

const statusLabels: Record<string, string> = {
  SCHEDULED: 'مجدولة',
  LIVE: 'مباشر الآن',
  ENDED: 'منتهية',
  CANCELLED: 'ملغاة',
};

const statusVariant = (status: string) => {
  if (status === 'LIVE') return 'live' as const;
  if (status === 'SCHEDULED') return 'info' as const;
  if (status === 'ENDED') return 'completed' as const;
  if (status === 'CANCELLED') return 'rejected' as const;
  return 'default' as const;
};

const fmtDate = (value?: string) => (value
  ? new Date(value).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  : '—');

const emptyForm = {
  courseId: '',
  titleAr: '',
  descriptionAr: '',
  startAt: '',
  durationMinutes: '60',
  meetingUrl: '',
};

const exportColumns = [
  { key: 'title', header: 'العنوان' },
  { key: 'course', header: 'الكورس' },
  { key: 'startAt', header: 'موعد البدء' },
  { key: 'duration', header: 'المدة (دقيقة)' },
  { key: 'status', header: 'الحالة' },
  { key: 'meetingUrl', header: 'رابط الاجتماع' },
];

export default function InstructorLivePage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('SCHEDULED');
  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [actionBusy, setActionBusy] = useState<number | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: number; type: 'cancel' | 'end' } | null>(null);

  const load = async () => {
    setLoading(true);
    const [sessionData, courseData] = await Promise.all([
      instructorApi.liveSessions(),
      instructorApi.courses({ status: 'all' }),
    ]);
    setSessions(sessionData);
    setCourses(courseData);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: sessions.length,
    scheduled: sessions.filter((s) => s.status === 'SCHEDULED').length,
    live: sessions.filter((s) => s.status === 'LIVE').length,
    ended: sessions.filter((s) => s.status === 'ENDED').length,
    cancelled: sessions.filter((s) => s.status === 'CANCELLED').length,
  }), [sessions]);

  const filtered = useMemo(() => {
    let result = sessions.filter((s) => {
      if (tab === 'ENDED') return s.status === 'ENDED';
      if (tab === 'CANCELLED') return s.status === 'CANCELLED';
      return s.status === tab;
    });
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((s) =>
        [s.titleAr, s.descriptionAr, s.course?.titleAr, statusLabels[s.status]]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [sessions, tab, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, courseId: courses[0] ? String(courses[0].id) : '' });
    setFormOpen(true);
  };

  const openEdit = (session: any) => {
    setEditing(session);
    const d = new Date(session.startAt);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setForm({
      courseId: String(session.courseId),
      titleAr: session.titleAr || '',
      descriptionAr: session.descriptionAr || '',
      startAt: d.toISOString().slice(0, 16),
      durationMinutes: String(session.durationMinutes || 60),
      meetingUrl: session.meetingUrl || '',
    });
    setFormOpen(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.courseId || !form.titleAr?.trim() || !form.startAt) {
      showToast('يرجى إكمال الكورس والعنوان وموعد البدء.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        courseId: Number(form.courseId),
        durationMinutes: Number(form.durationMinutes || 60),
      };
      if (editing) {
        await instructorApi.updateLiveSession(editing.id, payload);
        showToast('تم تحديث الجلسة.', 'success');
      } else {
        await instructorApi.createLiveSession(payload);
        showToast('تم إنشاء الجلسة.', 'success');
      }
      setFormOpen(false);
      setForm(emptyForm);
      setEditing(null);
      await load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || 'تعذّر حفظ الجلسة.';
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const runAction = async (id: number, action: 'start' | 'end' | 'cancel') => {
    setActionBusy(id);
    try {
      if (action === 'start') await instructorApi.startLiveSession(id);
      if (action === 'end') await instructorApi.endLiveSession(id);
      if (action === 'cancel') await instructorApi.cancelLiveSession(id);
      showToast(
        action === 'start' ? 'تم بدء الجلسة.' : action === 'end' ? 'تم إنهاء الجلسة.' : 'تم إلغاء الجلسة.',
        'success',
      );
      await load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || 'تعذّر تنفيذ الإجراء.';
      showToast(message, 'error');
    } finally {
      setActionBusy(null);
      setConfirmAction(null);
    }
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    showToast('تم نسخ رابط الاجتماع.', 'success');
  };

  const handleExport = () => {
    exportTableToExcel('جلسات-المحاضر', exportColumns, filtered.map((s) => ({
      title: s.titleAr,
      course: s.course?.titleAr || '—',
      startAt: fmtDate(s.startAt),
      duration: s.durationMinutes,
      status: statusLabels[s.status] || s.status,
      meetingUrl: s.meetingUrl || '—',
    })));
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title="الجلسات المباشرة"
          subtitle="جدولة وإدارة جلسات البث المباشر لطلابك"
        />
        <div className="reports-actions">
          <Button variant="outline" icon={<Download size={16} />} onClick={handleExport} disabled={!filtered.length}>
            تصدير
          </Button>
          <Button icon={<Plus size={16} />} onClick={openCreate} disabled={!courses.length}>
            إنشاء جلسة
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي الجلسات" value={String(stats.total)} icon={Video} />
        <StatCard title="مجدولة" value={String(stats.scheduled)} icon={Calendar} />
        <StatCard title="مباشر الآن" value={String(stats.live)} icon={Radio} hint={stats.live ? 'جلسة نشطة' : 'لا جلسة حية'} />
        <StatCard title="منتهية" value={String(stats.ended)} icon={Clock} />
      </div>

      <Tabs
        variant="pills"
        activeTab={tab}
        onChange={setTab}
        tabs={[
          { id: 'SCHEDULED', label: `القادمة (${stats.scheduled})` },
          { id: 'LIVE', label: `مباشر (${stats.live})` },
          { id: 'ENDED', label: `السابقة (${stats.ended})` },
          { id: 'CANCELLED', label: `الملغية (${stats.cancelled})` },
        ]}
      />

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالعنوان أو الكورس..."
        onSearchChange={setSearch}
        onReset={() => setSearch('')}
      />

      {loading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : filtered.length ? (
        <div className="live-sessions-feed">
          {filtered.map((session) => (
            <article
              key={session.id}
              className={`live-session-item ${session.status === 'LIVE' ? 'is-live' : ''}`}
            >
              <div className={`live-session-icon ${session.status.toLowerCase()}`}>
                {session.status === 'LIVE' ? <Radio size={22} /> : <Video size={22} />}
              </div>

              <div className="live-session-body">
                <div className="live-session-top">
                  <div>
                    <h3>{session.titleAr}</h3>
                    <p className="live-session-course">{session.course?.titleAr || '—'}</p>
                  </div>
                  <Badge variant={statusVariant(session.status)}>
                    {statusLabels[session.status] || session.status}
                  </Badge>
                </div>

                <div className="live-session-meta">
                  <span><Calendar size={14} /> {fmtDate(session.startAt)}</span>
                  <span><Clock size={14} /> {session.durationMinutes} دقيقة</span>
                </div>

                {session.descriptionAr ? (
                  <p className="live-session-desc">{session.descriptionAr}</p>
                ) : null}

                {session.meetingUrl ? (
                  <div className="live-session-link">
                    <a href={session.meetingUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} />
                      فتح رابط الاجتماع
                    </a>
                    <Button variant="ghost" size="sm" onClick={() => copyLink(session.meetingUrl)}>
                      <Copy size={14} />
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="live-session-actions">
                <Button variant="ghost" size="sm" onClick={() => setSelected(session)}>
                  التفاصيل
                </Button>
                {session.status === 'SCHEDULED' ? (
                  <>
                    <Button variant="outline" size="sm" loading={actionBusy === session.id} onClick={() => runAction(session.id, 'start')}>
                      بدء
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openEdit(session)}>
                      تعديل
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setConfirmAction({ id: session.id, type: 'cancel' })}>
                      إلغاء
                    </Button>
                  </>
                ) : null}
                {session.status === 'LIVE' ? (
                  <Button variant="danger" size="sm" loading={actionBusy === session.id} onClick={() => setConfirmAction({ id: session.id, type: 'end' })}>
                    إنهاء
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="لا توجد جلسات"
            description={tab === 'SCHEDULED' ? 'أنشئ جلسة مباشرة جديدة للبدء.' : 'لا توجد جلسات في هذا التبويب.'}
            icon={Video}
            {...(tab === 'SCHEDULED' && courses.length ? { actionLabel: 'إنشاء جلسة', onAction: openCreate } : {})}
          />
        </Card>
      )}

      <Modal
        isOpen={formOpen}
        title={editing ? 'تعديل الجلسة' : 'جلسة مباشرة جديدة'}
        onClose={() => !submitting && setFormOpen(false)}
      >
        <form className="stack-sm live-session-form" onSubmit={save}>
          <Select
            label="الكورس"
            value={form.courseId}
            onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            options={courses.map((c) => ({ label: c.titleAr, value: String(c.id) }))}
            required
          />
          <Input
            label="عنوان الجلسة"
            value={form.titleAr}
            onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            placeholder="مثال: مراجعة الوحدة الأولى"
            required
          />
          <Input
            label="التاريخ والوقت"
            type="datetime-local"
            value={form.startAt}
            helper="اختر موعد بدء الجلسة"
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            required
          />
          <Input
            label="المدة (دقيقة)"
            type="number"
            min={15}
            max={480}
            step={15}
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
            required
          />
          <Input
            label="رابط الاجتماع"
            value={form.meetingUrl}
            placeholder="https://zoom.us/j/..."
            dir="ltr"
            helper="Zoom أو Google Meet أو أي منصة"
            onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
          />
          <Textarea
            label="الوصف (اختياري)"
            rows={3}
            value={form.descriptionAr}
            onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
          />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={submitting}>
              إلغاء
            </Button>
            <Button type="submit" loading={submitting}>
              {editing ? 'حفظ التعديلات' : 'إنشاء الجلسة'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(selected)} title="تفاصيل الجلسة" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>العنوان</span><strong>{selected.titleAr}</strong></div>
            <div className="detail-row"><span>الكورس</span><strong>{selected.course?.titleAr || '—'}</strong></div>
            <div className="detail-row"><span>الموعد</span><strong>{fmtDate(selected.startAt)}</strong></div>
            <div className="detail-row"><span>المدة</span><strong>{selected.durationMinutes} دقيقة</strong></div>
            <div className="detail-row">
              <span>الحالة</span>
              <Badge variant={statusVariant(selected.status)}>{statusLabels[selected.status]}</Badge>
            </div>
            {selected.meetingUrl ? (
              <div className="detail-row">
                <span>الرابط</span>
                <a href={selected.meetingUrl} target="_blank" rel="noreferrer" dir="ltr">{selected.meetingUrl}</a>
              </div>
            ) : null}
            {selected.descriptionAr ? (
              <div className="admin-notification-body">
                <strong>الوصف</strong>
                <p>{selected.descriptionAr}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.type === 'end' ? 'إنهاء الجلسة؟' : 'إلغاء الجلسة؟'}
        message={confirmAction?.type === 'end'
          ? 'سيتم إنهاء البث وتحويل الجلسة إلى منتهية.'
          : 'سيتم إلغاء الجلسة ولن يتمكن الطلاب من حضورها.'}
        confirmLabel={confirmAction?.type === 'end' ? 'إنهاء' : 'إلغاء الجلسة'}
        variant="danger"
        onConfirm={() => confirmAction && runAction(confirmAction.id, confirmAction.type === 'end' ? 'end' : 'cancel')}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
