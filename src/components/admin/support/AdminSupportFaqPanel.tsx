import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Pencil, Plus, Trash2 } from '@/icons';
import { adminApi } from '../../../api/admin';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { FilterBar } from '../../ui/FilterBar';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { Table } from '../../ui/Table';
import { Textarea } from '../../ui/Textarea';
import { useToast } from '../../ui/Toast';
import { localizedText } from '../../../utils/localizedContent';

const emptyForm = {
  questionAr: '',
  questionEn: '',
  answerAr: '',
  answerEn: '',
  audience: 'ALL',
  sortOrder: '0',
  status: 'ACTIVE',
};

const AUDIENCES = ['ALL', 'STUDENT', 'INSTRUCTOR'] as const;

export function AdminSupportFaqPanel() {
  const { t, i18n } = useTranslation(['support', 'common']);
  const lang = i18n.language;
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const audienceLabel = (value: string) => t(`admin.faq.audience.${value}`, { defaultValue: value });
  const statusLabel = (value: string) => t(`admin.faq.status.${value}`, { defaultValue: value });

  const load = async () => {
    setLoading(true);
    try {
      setItems(await adminApi.supportFaqs());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter) result = result.filter((item) => item.status === statusFilter);
    if (audienceFilter) result = result.filter((item) => item.audience === audienceFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((item) =>
        [item.questionAr, item.questionEn, item.answerAr, item.answerEn]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, statusFilter, audienceFilter, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      questionAr: item.questionAr || '',
      questionEn: item.questionEn || '',
      answerAr: item.answerAr || '',
      answerEn: item.answerEn || '',
      audience: item.audience || 'ALL',
      sortOrder: String(item.sortOrder ?? 0),
      status: item.status || 'ACTIVE',
    });
    setFormOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.questionAr.trim() || !form.answerAr.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        questionAr: form.questionAr.trim(),
        questionEn: form.questionEn.trim() || undefined,
        answerAr: form.answerAr.trim(),
        answerEn: form.answerEn.trim() || undefined,
        audience: form.audience,
        sortOrder: Number(form.sortOrder || 0),
        status: form.status,
      };
      if (editing) {
        await adminApi.updateSupportFaq(editing.id, payload);
        showToast(t('admin.faq.toast.updated'), 'success');
      } else {
        await adminApi.createSupportFaq(payload);
        showToast(t('admin.faq.toast.created'), 'success');
      }
      setFormOpen(false);
      await load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('admin.faq.toast.saveFailed');
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (item: any) => {
    const next = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminApi.supportFaqStatus(item.id, next);
      showToast(t('admin.faq.toast.statusUpdated'), 'success');
      await load();
    } catch {
      showToast(t('admin.faq.toast.saveFailed'), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteSupportFaq(deleteTarget.id);
      showToast(t('admin.faq.toast.deleted'), 'success');
      setDeleteTarget(null);
      await load();
    } catch {
      showToast(t('admin.faq.toast.deleteFailed'), 'error');
    }
  };

  return (
    <div className="stack-md admin-support-faq-panel">
      <div className="reports-header">
        <div>
          <h2 className="support-faq-admin-title">
            <HelpCircle size={22} />
            {t('admin.faq.title')}
          </h2>
          <p className="field-helper">{t('admin.faq.subtitle')}</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={openCreate}>
          {t('admin.faq.add')}
        </Button>
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('admin.faq.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); setAudienceFilter(''); }}
      >
        <Select
          label={t('admin.faq.filters.status')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: t('admin.faq.filters.allStatuses'), value: '' },
            { label: statusLabel('ACTIVE'), value: 'ACTIVE' },
            { label: statusLabel('INACTIVE'), value: 'INACTIVE' },
          ]}
        />
        <Select
          label={t('admin.faq.filters.audience')}
          value={audienceFilter}
          onChange={(e) => setAudienceFilter(e.target.value)}
          options={[
            { label: t('admin.faq.filters.allAudiences'), value: '' },
            ...AUDIENCES.map((value) => ({ label: audienceLabel(value), value })),
          ]}
        />
      </FilterBar>

      <Card className="reports-table-card">
        <Table
          loading={loading}
          fluid
          hideScrollNotice
          data={filteredItems}
          emptyTitle={t('admin.faq.emptyTitle')}
          emptyDescription={t('admin.faq.emptyDescription')}
          columns={[
            {
              key: 'question',
              header: t('admin.faq.columns.question'),
              render: (row) => localizedText({ ar: row.questionAr, en: row.questionEn }, lang),
            },
            {
              key: 'audience',
              header: t('admin.faq.columns.audience'),
              render: (row) => audienceLabel(row.audience),
            },
            {
              key: 'sortOrder',
              header: t('admin.faq.columns.order'),
              align: 'center',
            },
            {
              key: 'status',
              header: t('admin.faq.columns.status'),
              align: 'center',
              render: (row) => (
                <Badge variant={row.status === 'ACTIVE' ? 'success' : 'default'}>
                  {statusLabel(row.status)}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: t('admin.faq.columns.actions'),
              render: (row) => (
                <div className="table-actions">
                  <Button variant="outline" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(row)}>
                    {t('admin.faq.actions.edit')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleStatus(row)}>
                    {row.status === 'ACTIVE' ? t('admin.faq.actions.deactivate') : t('admin.faq.actions.activate')}
                  </Button>
                  <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleteTarget(row)}>
                    {t('admin.faq.actions.delete')}
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal isOpen={formOpen} title={editing ? t('admin.faq.modal.editTitle') : t('admin.faq.modal.createTitle')} onClose={() => !submitting && setFormOpen(false)}>
        <form className="stack-sm" onSubmit={submit}>
          <Input label={t('admin.faq.form.questionAr')} value={form.questionAr} onChange={(e) => setForm({ ...form, questionAr: e.target.value })} required />
          <Input label={t('admin.faq.form.questionEn')} value={form.questionEn} onChange={(e) => setForm({ ...form, questionEn: e.target.value })} />
          <Textarea label={t('admin.faq.form.answerAr')} rows={4} value={form.answerAr} onChange={(e) => setForm({ ...form, answerAr: e.target.value })} required />
          <Textarea label={t('admin.faq.form.answerEn')} rows={4} value={form.answerEn} onChange={(e) => setForm({ ...form, answerEn: e.target.value })} />
          <Select
            label={t('admin.faq.form.audience')}
            value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value })}
            options={AUDIENCES.map((value) => ({ label: audienceLabel(value), value }))}
          />
          <Input label={t('admin.faq.form.sortOrder')} type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
          <Select
            label={t('admin.faq.form.status')}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { label: statusLabel('ACTIVE'), value: 'ACTIVE' },
              { label: statusLabel('INACTIVE'), value: 'INACTIVE' },
            ]}
          />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={submitting}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" loading={submitting}>
              {editing ? t('admin.faq.modal.save') : t('admin.faq.modal.create')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('admin.faq.delete.title')}
        message={t('admin.faq.delete.message', {
          question: localizedText({ ar: deleteTarget?.questionAr, en: deleteTarget?.questionEn }, lang),
        })}
        confirmLabel={t('admin.faq.delete.confirm')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
