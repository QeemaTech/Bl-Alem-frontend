import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Download, GraduationCap, Plus, Users, Wallet } from '@/icons';
import { adminApi } from '../../api/admin';
import { InstructorsTable } from '../../components/admin/users/InstructorsTable';
import { ReportChart } from '../../components/reports/ReportChart';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterBar } from '../../components/ui/FilterBar';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { useAdminUserLabels } from '../../hooks/useAdminUserLabels';
import { exportTableToExcel } from '../../utils/exportExcel';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  title: '',
  specialization: '',
  yearsOfExperience: '',
  bio: '',
  status: 'PENDING',
  approvalStatus: 'PENDING',
};

export default function AdminInstructorsPage() {
  const { t } = useTranslation(['users', 'common']);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    approvalLabels,
    statusLabels,
    fmtDate,
    fmtMoney,
    empty,
  } = useAdminUserLabels();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const exportColumns = useMemo(() => {
    const cols = t('admin.instructors.export.columns', { returnObjects: true }) as Record<string, string>;
    return [
      { key: 'id', header: cols.id },
      { key: 'fullName', header: cols.fullName },
      { key: 'email', header: cols.email },
      { key: 'phone', header: cols.phone },
      { key: 'title', header: cols.title },
      { key: 'specialization', header: cols.specialization },
      { key: 'courses', header: cols.courses },
      { key: 'students', header: cols.students },
      { key: 'earnings', header: cols.earnings },
      { key: 'approvalStatus', header: cols.approvalStatus },
      { key: 'accountStatus', header: cols.accountStatus },
      { key: 'joinedAt', header: cols.joinedAt },
    ];
  }, [t]);

  const load = async () => {
    setLoading(true);
    setItems(await adminApi.instructors());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (approvalFilter) {
      result = result.filter((i) => i.instructorProfile?.approvalStatus === approvalFilter);
    }
    if (accountFilter) result = result.filter((i) => i.status === accountFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [
          i.fullName,
          i.email,
          i.phone,
          i.instructorProfile?.title,
          i.instructorProfile?.specialization,
          String(i.id),
        ].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, approvalFilter, accountFilter, search]);

  const hasActiveFilters = Boolean(search.trim() || approvalFilter || accountFilter);

  const stats = useMemo(() => ({
    total: items.length,
    pending: items.filter((i) => i.instructorProfile?.approvalStatus === 'PENDING').length,
    approved: items.filter((i) => i.instructorProfile?.approvalStatus === 'APPROVED').length,
    rejected: items.filter((i) => i.instructorProfile?.approvalStatus === 'REJECTED').length,
    suspended: items.filter((i) => i.instructorProfile?.approvalStatus === 'SUSPENDED').length,
    courses: items.reduce((sum, i) => sum + Number(i._count?.courses || 0), 0),
    earnings: items.reduce((sum, i) => sum + Number(i.instructorProfile?.totalEarnings || 0), 0),
  }), [items]);

  const approvalChart = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const key = i.instructorProfile?.approvalStatus || 'UNKNOWN';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      label: approvalLabels[key] || key,
      value,
    }));
  }, [items, approvalLabels]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone || empty,
    title: row.instructorProfile?.title || empty,
    specialization: row.instructorProfile?.specialization || empty,
    courses: String(row._count?.courses ?? 0),
    students: String(row.instructorProfile?.totalStudents ?? 0),
    earnings: fmtMoney(Number(row.instructorProfile?.totalEarnings || 0)),
    approvalStatus: approvalLabels[row.instructorProfile?.approvalStatus] || empty,
    accountStatus: statusLabels[row.status] || row.status,
    joinedAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems, approvalLabels, statusLabels, fmtDate, fmtMoney, empty]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (instructor: any) => {
    setEditing(instructor);
    setForm({
      fullName: instructor.fullName,
      email: instructor.email,
      phone: instructor.phone || '',
      password: '',
      title: instructor.instructorProfile?.title || '',
      specialization: instructor.instructorProfile?.specialization || '',
      yearsOfExperience: instructor.instructorProfile?.yearsOfExperience
        ? String(instructor.instructorProfile.yearsOfExperience)
        : '',
      bio: instructor.instructorProfile?.bio || '',
      status: instructor.status,
      approvalStatus: instructor.instructorProfile?.approvalStatus || 'PENDING',
    });
    setFormOpen(true);
  };

  const goToDetail = (instructor: any) => navigate(`/admin/instructors/${instructor.id}`);

  const saveInstructor = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        title: form.title.trim() || null,
        specialization: form.specialization.trim() || null,
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : null,
        bio: form.bio.trim() || null,
        status: form.status,
        approvalStatus: form.approvalStatus,
      };
      if (editing) {
        if (form.password.trim()) payload.password = form.password;
        await adminApi.updateInstructor(editing.id, payload);
        showToast(t('admin.instructors.toast.updated'), 'success');
      } else {
        payload.password = form.password.trim() || 'Password123!';
        await adminApi.createInstructor(payload);
        showToast(t('admin.instructors.toast.created'), 'success');
      }
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch {
      showToast(t('admin.instructors.toast.saveError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (instructor: any) => {
    await adminApi.approveInstructor(instructor.id);
    showToast(t('admin.instructors.toast.approved'), 'success');
    await load();
  };

  const handleReject = async (e: FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    await adminApi.rejectInstructor(rejectTarget.id, rejectReason);
    showToast(t('admin.instructors.toast.rejected'), 'success');
    setRejectTarget(null);
    setRejectReason('');
    await load();
  };

  const handleSuspend = async (instructor: any) => {
    await adminApi.suspendInstructor(instructor.id);
    showToast(t('admin.instructors.toast.suspended'), 'success');
    await load();
  };

  const handleActivate = async (instructor: any) => {
    await adminApi.activateInstructor(instructor.id);
    showToast(t('admin.instructors.toast.activated'), 'success');
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteInstructor(deleteTarget.id);
      showToast(t('admin.instructors.toast.deleted'), 'success');
      setDeleteTarget(null);
      await load();
    } catch {
      showToast(t('admin.instructors.toast.deleteError'), 'error');
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      t('admin.instructors.export.sheetName'),
      exportColumns,
      tableRows.map(({ _raw, ...row }) => row),
    );
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title={t('admin.instructors.title')} subtitle={t('admin.instructors.subtitle')} />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            {t('actions.exportExcel')}
          </Button>
          <Button icon={<Plus size={18} />} onClick={openCreate}>
            {t('admin.instructors.addInstructor')}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('admin.instructors.stats.total')} value={String(stats.total)} icon={GraduationCap} />
        <StatCard title={t('admin.instructors.stats.pending')} value={String(stats.pending)} icon={Users} />
        <StatCard title={t('admin.instructors.stats.approved')} value={String(stats.approved)} icon={GraduationCap} />
        <StatCard title={t('admin.instructors.stats.rejectedSuspended')} value={String(stats.rejected + stats.suspended)} icon={Users} />
        <StatCard title={t('admin.instructors.stats.totalCourses')} value={String(stats.courses)} icon={BookOpen} />
        <StatCard title={t('admin.instructors.stats.totalEarnings')} value={fmtMoney(stats.earnings)} icon={Wallet} />
      </div>

      <div className="reports-charts-grid">
        <ReportChart title={t('admin.instructors.charts.approvalDistribution')} type="pie" data={approvalChart} />
      </div>

      <FilterBar
        className="filter-bar--modern"
        searchValue={search}
        searchPlaceholder={t('admin.instructors.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setApprovalFilter(''); setAccountFilter(''); }}
        resetDisabled={!hasActiveFilters}
        searchIconSize={20}
      >
        <Select
          label={t('filters.approvalStatus')}
          value={approvalFilter}
          onChange={(e) => setApprovalFilter(e.target.value)}
          options={[
            { label: t('filters.allStatuses'), value: '' },
            { label: approvalLabels.PENDING, value: 'PENDING' },
            { label: approvalLabels.APPROVED, value: 'APPROVED' },
            { label: approvalLabels.REJECTED, value: 'REJECTED' },
            { label: approvalLabels.SUSPENDED, value: 'SUSPENDED' },
          ]}
        />
        <Select
          label={t('filters.accountStatus')}
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          options={[
            { label: t('filters.allAccounts'), value: '' },
            { label: statusLabels.ACTIVE, value: 'ACTIVE' },
            { label: statusLabels.PENDING, value: 'PENDING' },
            { label: statusLabels.SUSPENDED, value: 'SUSPENDED' },
            { label: statusLabels.REJECTED, value: 'REJECTED' },
          ]}
        />
      </FilterBar>

      <InstructorsTable
        items={tableRows}
        loading={loading}
        onDetail={goToDetail}
        onEdit={openEdit}
        onApprove={handleApprove}
        onReject={setRejectTarget}
        onSuspend={handleSuspend}
        onActivate={handleActivate}
        onDelete={setDeleteTarget}
      />

      <Modal
        isOpen={formOpen}
        title={editing ? t('admin.instructors.editInstructor') : t('admin.instructors.addInstructor')}
        onClose={() => { setFormOpen(false); setEditing(null); setForm(emptyForm); }}
      >
        <form className="stack-sm" onSubmit={saveInstructor}>
          <Input label={t('form.fullName')} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <Input label={t('form.email')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label={t('form.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
          <Input
            label={editing ? t('form.passwordOptional') : t('form.password')}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editing}
          />
          <Input label={t('form.title')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('form.titlePlaceholder')} />
          <Input label={t('form.specialization')} value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
          <Input label={t('form.yearsOfExperience')} type="number" min="0" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} />
          <Textarea label={t('form.bio')} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <Select
            label={t('form.accountStatus')}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { label: statusLabels.ACTIVE, value: 'ACTIVE' },
              { label: statusLabels.PENDING, value: 'PENDING' },
              { label: statusLabels.SUSPENDED, value: 'SUSPENDED' },
              { label: statusLabels.REJECTED, value: 'REJECTED' },
            ]}
          />
          <Select
            label={t('filters.approvalStatus')}
            value={form.approvalStatus}
            onChange={(e) => setForm({ ...form, approvalStatus: e.target.value })}
            options={[
              { label: approvalLabels.PENDING, value: 'PENDING' },
              { label: approvalLabels.APPROVED, value: 'APPROVED' },
              { label: approvalLabels.REJECTED, value: 'REJECTED' },
              { label: approvalLabels.SUSPENDED, value: 'SUSPENDED' },
            ]}
          />
          <Button loading={submitting}>
            {editing ? t('actions.saveChanges') : t('admin.instructors.createInstructor')}
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(rejectTarget)}
        title={t('admin.instructors.rejectTitle')}
        onClose={() => { setRejectTarget(null); setRejectReason(''); }}
      >
        <form className="stack-sm" onSubmit={handleReject}>
          <p>{t('admin.instructors.rejectPrompt')} <strong>{rejectTarget?.fullName}</strong></p>
          <Textarea label={t('form.rejectReason')} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required />
          <Button variant="danger">{t('actions.confirmReject')}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('admin.instructors.deleteTitle')}
        message={t('admin.instructors.deleteMessage', { name: deleteTarget?.fullName })}
        confirmLabel={t('actions.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
