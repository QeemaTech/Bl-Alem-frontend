import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { formatDateTime } from '../../utils/localeFormat';
import {
  localizedCourseTitle,
  localizedSessionDescription,
  localizedSessionTitle,
} from '../../utils/localizedContent';

const statusVariant = (status: string) => {
  if (status === 'LIVE') return 'live' as const;
  if (status === 'SCHEDULED') return 'info' as const;
  if (status === 'ENDED') return 'completed' as const;
  if (status === 'CANCELLED') return 'rejected' as const;
  return 'default' as const;
};

const emptyForm = {
  courseId: '',
  titleAr: '',
  descriptionAr: '',
  startAt: '',
  durationMinutes: '60',
  meetingUrl: '',
};

export default function InstructorLivePage() {
  const { t, i18n } = useTranslation('liveSessions');
  const { t: tc } = useTranslation('common');
  const lang = i18n.language;
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

  const empty = t('empty');

  const getStatusLabel = useCallback(
    (status: string) => t(`labels.status.${status}`, { defaultValue: status }),
    [t, lang],
  );

  const fmtDate = useCallback(
    (value?: string) => (value
      ? formatDateTime(value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }, lang)
      : empty),
    [lang, empty],
  );

  const fmtDuration = useCallback(
    (minutes?: number) => t('durationMinutes', { count: minutes || 60 }),
    [t, lang],
  );

  const exportColumns = useMemo(() => {
    const cols = t('instructor.exportColumns', { returnObjects: true }) as Record<string, string>;
    return [
      { key: 'title', header: cols.title },
      { key: 'course', header: cols.course },
      { key: 'startAt', header: cols.startAt },
      { key: 'duration', header: cols.duration },
      { key: 'status', header: cols.status },
      { key: 'meetingUrl', header: cols.meetingUrl },
    ];
  }, [t, lang]);

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
        [
          localizedSessionTitle(s, lang),
          localizedSessionDescription(s, lang),
          localizedCourseTitle(s.course, lang),
          getStatusLabel(s.status),
        ].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [sessions, tab, search, lang, getStatusLabel]);

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
      showToast(t('instructor.toast.validation'), 'error');
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
        showToast(t('toast.updated'), 'success');
      } else {
        await instructorApi.createLiveSession(payload);
        showToast(t('instructor.toast.created'), 'success');
      }
      setFormOpen(false);
      setForm(emptyForm);
      setEditing(null);
      await load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('instructor.toast.saveFailed');
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
        action === 'start' ? t('toast.started') : action === 'end' ? t('toast.ended') : t('toast.cancelled'),
        'success',
      );
      await load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('instructor.toast.actionFailed');
      showToast(message, 'error');
    } finally {
      setActionBusy(null);
      setConfirmAction(null);
    }
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    showToast(t('toast.linkCopied'), 'success');
  };

  const handleExport = () => {
    exportTableToExcel(t('instructor.exportSheet'), exportColumns, filtered.map((s) => ({
      title: localizedSessionTitle(s, lang),
      course: localizedCourseTitle(s.course, lang) || empty,
      startAt: fmtDate(s.startAt),
      duration: s.durationMinutes,
      status: getStatusLabel(s.status),
      meetingUrl: s.meetingUrl || empty,
    })));
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title={t('instructor.title')}
          subtitle={t('instructor.subtitle')}
        />
        <div className="reports-actions">
          <Button variant="outline" icon={<Download size={16} />} onClick={handleExport} disabled={!filtered.length}>
            {t('instructor.export')}
          </Button>
          <Button icon={<Plus size={16} />} onClick={openCreate} disabled={!courses.length}>
            {t('instructor.createSession')}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('stats.total')} value={String(stats.total)} icon={Video} />
        <StatCard title={t('stats.scheduled')} value={String(stats.scheduled)} icon={Calendar} />
        <StatCard
          title={t('stats.live')}
          value={String(stats.live)}
          icon={Radio}
          hint={stats.live ? t('instructor.stats.liveHintActive') : t('instructor.stats.liveHintNone')}
        />
        <StatCard title={t('stats.ended')} value={String(stats.ended)} icon={Clock} />
      </div>

      <Tabs
        variant="pills"
        activeTab={tab}
        onChange={setTab}
        tabs={[
          { id: 'SCHEDULED', label: t('instructor.tabs.scheduled', { count: stats.scheduled }) },
          { id: 'LIVE', label: t('instructor.tabs.live', { count: stats.live }) },
          { id: 'ENDED', label: t('instructor.tabs.ended', { count: stats.ended }) },
          { id: 'CANCELLED', label: t('instructor.tabs.cancelled', { count: stats.cancelled }) },
        ]}
      />

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('instructor.searchPlaceholder')}
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
                    <h3>{localizedSessionTitle(session, lang)}</h3>
                    <p className="live-session-course">{localizedCourseTitle(session.course, lang) || empty}</p>
                  </div>
                  <Badge variant={statusVariant(session.status)}>
                    {getStatusLabel(session.status)}
                  </Badge>
                </div>

                <div className="live-session-meta">
                  <span><Calendar size={14} /> {fmtDate(session.startAt)}</span>
                  <span><Clock size={14} /> {fmtDuration(session.durationMinutes)}</span>
                </div>

                {localizedSessionDescription(session, lang) ? (
                  <p className="live-session-desc">{localizedSessionDescription(session, lang)}</p>
                ) : null}

                {session.meetingUrl ? (
                  <div className="live-session-link">
                    <a href={session.meetingUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} />
                      {t('instructor.openMeetingLink')}
                    </a>
                    <Button variant="ghost" size="sm" onClick={() => copyLink(session.meetingUrl)}>
                      <Copy size={14} />
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="live-session-actions">
                <Button variant="ghost" size="sm" onClick={() => setSelected(session)}>
                  {t('actions.detail')}
                </Button>
                {session.status === 'SCHEDULED' ? (
                  <>
                    <Button variant="outline" size="sm" loading={actionBusy === session.id} onClick={() => runAction(session.id, 'start')}>
                      {t('actions.start')}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openEdit(session)}>
                      {t('actions.edit')}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setConfirmAction({ id: session.id, type: 'cancel' })}>
                      {t('actions.cancel')}
                    </Button>
                  </>
                ) : null}
                {session.status === 'LIVE' ? (
                  <Button variant="danger" size="sm" loading={actionBusy === session.id} onClick={() => setConfirmAction({ id: session.id, type: 'end' })}>
                    {t('actions.end')}
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title={t('table.emptyTitle')}
            description={tab === 'SCHEDULED' ? t('instructor.empty.createNew') : t('instructor.empty.noInTab')}
            icon={Video}
            {...(tab === 'SCHEDULED' && courses.length ? { actionLabel: t('instructor.createSession'), onAction: openCreate } : {})}
          />
        </Card>
      )}

      <Modal
        isOpen={formOpen}
        title={editing ? t('form.editTitle') : t('instructor.form.createTitle')}
        onClose={() => !submitting && setFormOpen(false)}
      >
        <form className="stack-sm live-session-form" onSubmit={save}>
          <Select
            label={t('instructor.form.courseLabel')}
            value={form.courseId}
            onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            options={courses.map((c) => ({ label: localizedCourseTitle(c, lang), value: String(c.id) }))}
            required
          />
          <Input
            label={t('instructor.form.titleLabel')}
            value={form.titleAr}
            onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            placeholder={t('instructor.form.titlePlaceholder')}
            required
          />
          <Input
            label={t('instructor.form.startAtLabel')}
            type="datetime-local"
            value={form.startAt}
            helper={t('instructor.form.startAtHelper')}
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            required
          />
          <Input
            label={t('instructor.form.durationLabel')}
            type="number"
            min={15}
            max={480}
            step={15}
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
            required
          />
          <Input
            label={t('form.meetingUrlLabel')}
            value={form.meetingUrl}
            placeholder={t('form.meetingUrlPlaceholder')}
            dir="ltr"
            helper={t('instructor.form.meetingUrlHelper')}
            onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
          />
          <Textarea
            label={t('instructor.form.descriptionLabel')}
            rows={3}
            value={form.descriptionAr}
            onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
          />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={submitting}>
              {tc('actions.cancel')}
            </Button>
            <Button type="submit" loading={submitting}>
              {editing ? t('actions.saveChanges') : t('instructor.form.create')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(selected)} title={t('detail.title')} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>{t('detail.fields.title')}</span><strong>{localizedSessionTitle(selected, lang)}</strong></div>
            <div className="detail-row"><span>{t('detail.fields.course')}</span><strong>{localizedCourseTitle(selected.course, lang) || empty}</strong></div>
            <div className="detail-row"><span>{t('instructor.detailFields.startAt')}</span><strong>{fmtDate(selected.startAt)}</strong></div>
            <div className="detail-row"><span>{t('detail.fields.duration')}</span><strong>{fmtDuration(selected.durationMinutes)}</strong></div>
            <div className="detail-row">
              <span>{t('detail.fields.status')}</span>
              <Badge variant={statusVariant(selected.status)}>{getStatusLabel(selected.status)}</Badge>
            </div>
            {selected.meetingUrl ? (
              <div className="detail-row">
                <span>{t('instructor.detailFields.url')}</span>
                <a href={selected.meetingUrl} target="_blank" rel="noreferrer" dir="ltr">{selected.meetingUrl}</a>
              </div>
            ) : null}
            {localizedSessionDescription(selected, lang) ? (
              <div className="admin-notification-body">
                <strong>{t('detail.fields.description')}</strong>
                <p>{localizedSessionDescription(selected, lang)}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.type === 'end' ? t('instructor.confirm.endTitle') : t('instructor.confirm.cancelTitle')}
        message={confirmAction?.type === 'end'
          ? t('instructor.confirm.endMessage')
          : t('instructor.confirm.cancelMessage')}
        confirmLabel={confirmAction?.type === 'end' ? t('actions.end') : t('instructor.confirm.cancelConfirm')}
        variant="danger"
        onConfirm={() => confirmAction && runAction(confirmAction.id, confirmAction.type === 'end' ? 'end' : 'cancel')}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
