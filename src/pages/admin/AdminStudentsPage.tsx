import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Award, BookOpen, Download, Plus, Users, Wallet } from '@/icons';
import { adminApi } from '../../api/admin';
import { StudentsTable } from '../../components/admin/users/StudentsTable';
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
  bio: '',
  educationLevel: '',
  interests: '',
  status: 'ACTIVE',
};

export default function AdminStudentsPage() {
  const { t } = useTranslation(['users', 'common']);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    statusLabels,
    fmtDate,
    fmtMoney,
    formatInterests,
    empty,
  } = useAdminUserLabels();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const exportColumns = useMemo(() => {
    const cols = t('admin.students.export.columns', { returnObjects: true }) as Record<string, string>;
    return [
      { key: 'id', header: cols.id },
      { key: 'fullName', header: cols.fullName },
      { key: 'email', header: cols.email },
      { key: 'phone', header: cols.phone },
      { key: 'educationLevel', header: cols.educationLevel },
      { key: 'enrollments', header: cols.enrollments },
      { key: 'payments', header: cols.payments },
      { key: 'certificates', header: cols.certificates },
      { key: 'wallet', header: cols.wallet },
      { key: 'status', header: cols.status },
      { key: 'joinedAt', header: cols.joinedAt },
    ];
  }, [t]);

  const load = async () => {
    setLoading(true);
    setItems(await adminApi.students());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [
          i.fullName,
          i.email,
          i.phone,
          i.studentProfile?.educationLevel,
          i.studentProfile?.bio,
          String(i.id),
        ].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, statusFilter, search]);

  const hasActiveFilters = Boolean(search.trim() || statusFilter);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((i) => i.status === 'ACTIVE').length,
    suspended: items.filter((i) => i.status === 'SUSPENDED').length,
    pending: items.filter((i) => i.status === 'PENDING').length,
    enrollments: items.reduce((sum, i) => sum + Number(i._count?.enrollments || 0), 0),
    certificates: items.reduce((sum, i) => sum + Number(i._count?.certificates || 0), 0),
    walletTotal: items.reduce((sum, i) => sum + Number(i.wallet?.balance || 0), 0),
  }), [items]);

  const statusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const key = i.status;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      label: statusLabels[key] || key,
      value,
    }));
  }, [items, statusLabels]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone || empty,
    educationLevel: row.studentProfile?.educationLevel || empty,
    enrollments: String(row._count?.enrollments ?? 0),
    payments: String(row._count?.payments ?? 0),
    certificates: String(row._count?.certificates ?? 0),
    wallet: fmtMoney(Number(row.wallet?.balance || 0)),
    status: statusLabels[row.status] || row.status,
    joinedAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems, statusLabels, fmtDate, fmtMoney, empty]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (student: any) => {
    setEditing(student);
    const interestsFormatted = formatInterests(student.studentProfile?.interests);
    setForm({
      fullName: student.fullName,
      email: student.email,
      phone: student.phone || '',
      password: '',
      bio: student.studentProfile?.bio || '',
      educationLevel: student.studentProfile?.educationLevel || '',
      interests: interestsFormatted === empty ? '' : interestsFormatted,
      status: student.status,
    });
    setFormOpen(true);
  };

  const goToDetail = (student: any) => navigate(`/admin/students/${student.id}`);

  const saveStudent = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        bio: form.bio.trim() || null,
        educationLevel: form.educationLevel.trim() || null,
        interests: form.interests.trim() || null,
        status: form.status,
      };
      if (editing) {
        if (form.password.trim()) payload.password = form.password;
        await adminApi.updateStudent(editing.id, payload);
        showToast(t('admin.students.toast.updated'), 'success');
      } else {
        payload.password = form.password.trim() || 'Password123!';
        await adminApi.createStudent(payload);
        showToast(t('admin.students.toast.created'), 'success');
      }
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch {
      showToast(t('admin.students.toast.saveError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (student: any) => {
    const next = student.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await adminApi.userStatus(student.id, next);
    showToast(
      next === 'ACTIVE' ? t('admin.students.toast.activated') : t('admin.students.toast.suspended'),
      'success',
    );
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteStudent(deleteTarget.id);
      showToast(t('admin.students.toast.deleted'), 'success');
      setDeleteTarget(null);
      await load();
    } catch {
      showToast(t('admin.students.toast.deleteError'), 'error');
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      t('admin.students.export.sheetName'),
      exportColumns,
      tableRows.map(({ _raw, ...row }) => row),
    );
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title={t('admin.students.title')} subtitle={t('admin.students.subtitle')} />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            {t('actions.exportExcel')}
          </Button>
          <Button icon={<Plus size={18} />} onClick={openCreate}>
            {t('admin.students.addStudent')}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('admin.students.stats.total')} value={String(stats.total)} icon={Users} />
        <StatCard title={t('admin.students.stats.active')} value={String(stats.active)} icon={Users} />
        <StatCard title={t('admin.students.stats.suspended')} value={String(stats.suspended)} icon={Users} />
        <StatCard title={t('admin.students.stats.totalEnrollments')} value={String(stats.enrollments)} icon={BookOpen} />
        <StatCard title={t('admin.students.stats.certificates')} value={String(stats.certificates)} icon={Award} />
        <StatCard title={t('admin.students.stats.walletTotal')} value={fmtMoney(stats.walletTotal)} icon={Wallet} />
      </div>

      <div className="reports-charts-grid">
        <ReportChart title={t('admin.students.charts.statusDistribution')} type="pie" data={statusChart} />
      </div>

      <FilterBar
        className="filter-bar--modern"
        searchValue={search}
        searchPlaceholder={t('admin.students.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
        resetDisabled={!hasActiveFilters}
        searchIconSize={20}
      >
        <Select
          label={t('filters.accountStatus')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: t('filters.allStatuses'), value: '' },
            { label: statusLabels.ACTIVE, value: 'ACTIVE' },
            { label: statusLabels.PENDING, value: 'PENDING' },
            { label: statusLabels.SUSPENDED, value: 'SUSPENDED' },
            { label: statusLabels.REJECTED, value: 'REJECTED' },
          ]}
        />
      </FilterBar>

      <StudentsTable
        items={tableRows}
        loading={loading}
        onDetail={goToDetail}
        onEdit={openEdit}
        onToggleStatus={toggleStatus}
        onDelete={setDeleteTarget}
      />

      <Modal
        isOpen={formOpen}
        title={editing ? t('admin.students.editStudent') : t('admin.students.addStudent')}
        onClose={() => { setFormOpen(false); setEditing(null); setForm(emptyForm); }}
      >
        <form className="stack-sm" onSubmit={saveStudent}>
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
          <Input label={t('form.educationLevel')} value={form.educationLevel} onChange={(e) => setForm({ ...form, educationLevel: e.target.value })} placeholder={t('form.educationLevelPlaceholder')} />
          <Input label={t('form.interests')} value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder={t('form.interestsPlaceholder')} />
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
          <Button loading={submitting}>
            {editing ? t('actions.saveChanges') : t('admin.students.createStudent')}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('admin.students.deleteTitle')}
        message={t('admin.students.deleteMessage', { name: deleteTarget?.fullName })}
        confirmLabel={t('actions.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
