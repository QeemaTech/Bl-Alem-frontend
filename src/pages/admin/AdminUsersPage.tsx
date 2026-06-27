import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Shield, UserCheck, Users } from '@/icons';
import { adminApi } from '../../api/admin';
import { UsersTable } from '../../components/admin/users/UsersTable';
import { ReportChart } from '../../components/reports/ReportChart';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterBar } from '../../components/ui/FilterBar';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { useAdminUserLabels } from '../../hooks/useAdminUserLabels';
import { exportTableToExcel } from '../../utils/exportExcel';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'STUDENT',
  status: 'ACTIVE',
};

export default function AdminUsersPage() {
  const { t } = useTranslation(['users', 'common']);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    roleLabels,
    statusLabels,
    fmtDate,
    fmtMoney,
    activityLabel,
    empty,
  } = useAdminUserLabels();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const exportColumns = useMemo(() => {
    const cols = t('admin.users.export.columns', { returnObjects: true }) as Record<string, string>;
    return [
      { key: 'id', header: cols.id },
      { key: 'fullName', header: cols.fullName },
      { key: 'email', header: cols.email },
      { key: 'phone', header: cols.phone },
      { key: 'role', header: cols.role },
      { key: 'status', header: cols.status },
      { key: 'wallet', header: cols.wallet },
      { key: 'activity', header: cols.activity },
      { key: 'joinedAt', header: cols.joinedAt },
    ];
  }, [t]);

  const load = async () => {
    setLoading(true);
    setItems(await adminApi.users());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (roleFilter) result = result.filter((i) => i.role === roleFilter);
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [i.fullName, i.email, i.phone, String(i.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, roleFilter, statusFilter, search]);

  const hasActiveFilters = Boolean(search.trim() || roleFilter || statusFilter);

  const stats = useMemo(() => ({
    total: items.length,
    students: items.filter((i) => i.role === 'STUDENT').length,
    instructors: items.filter((i) => i.role === 'INSTRUCTOR').length,
    admins: items.filter((i) => i.role === 'SUPER_ADMIN').length,
    active: items.filter((i) => i.status === 'ACTIVE').length,
    suspended: items.filter((i) => i.status === 'SUSPENDED').length,
  }), [items]);

  const roleChart = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const key = i.role;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      label: roleLabels[key] || key,
      value,
    }));
  }, [items, roleLabels]);

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
    role: roleLabels[row.role] || row.role,
    status: statusLabels[row.status] || row.status,
    wallet: fmtMoney(Number(row.wallet?.balance || 0)),
    activity: activityLabel(row),
    joinedAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems, roleLabels, statusLabels, fmtDate, fmtMoney, activityLabel, empty]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (user: any) => {
    setEditing(user);
    setForm({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role,
      status: user.status,
    });
    setFormOpen(true);
  };

  const goToDetail = (user: any) => navigate(`/admin/users/${user.id}`);

  const saveUser = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
        status: form.status,
        preferredLanguage: editing?.preferredLanguage || 'ar',
      };
      if (editing) {
        if (form.password.trim()) payload.password = form.password;
        await adminApi.updateUser(editing.id, payload);
        showToast(t('admin.users.toast.updated'), 'success');
      } else {
        payload.password = form.password.trim() || 'Password123!';
        await adminApi.createUser(payload);
        showToast(t('admin.users.toast.created'), 'success');
      }
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch {
      showToast(t('admin.users.toast.saveError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (user: any) => {
    const next = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await adminApi.userStatus(user.id, next);
    showToast(
      next === 'ACTIVE' ? t('admin.users.toast.activated') : t('admin.users.toast.suspended'),
      'success',
    );
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteUser(deleteTarget.id);
      showToast(t('admin.users.toast.deleted'), 'success');
      setDeleteTarget(null);
      await load();
    } catch {
      showToast(t('admin.users.toast.deleteError'), 'error');
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      t('admin.users.export.sheetName'),
      exportColumns,
      tableRows.map(({ _raw, ...row }) => row),
    );
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title={t('admin.users.title')} subtitle={t('admin.users.subtitle')} />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            {t('actions.exportExcel')}
          </Button>
          <Button icon={<Plus size={18} />} onClick={openCreate}>
            {t('admin.users.addUser')}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('admin.users.stats.total')} value={String(stats.total)} icon={Users} />
        <StatCard title={t('admin.users.stats.students')} value={String(stats.students)} icon={UserCheck} />
        <StatCard title={t('admin.users.stats.instructors')} value={String(stats.instructors)} icon={Users} />
        <StatCard title={t('admin.users.stats.admins')} value={String(stats.admins)} icon={Shield} />
        <StatCard title={t('admin.users.stats.active')} value={String(stats.active)} icon={UserCheck} />
        <StatCard title={t('admin.users.stats.suspended')} value={String(stats.suspended)} icon={Users} />
      </div>

      <div className="reports-charts-grid">
        <ReportChart title={t('admin.users.charts.roleDistribution')} type="pie" data={roleChart} />
        <ReportChart title={t('admin.users.charts.statusDistribution')} type="pie" data={statusChart} />
      </div>

      <FilterBar
        className="filter-bar--modern"
        searchValue={search}
        searchPlaceholder={t('admin.users.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}
        resetDisabled={!hasActiveFilters}
        searchIconSize={20}
      >
        <Select
          label={t('filters.role')}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={[
            { label: t('filters.allRoles'), value: '' },
            { label: roleLabels.STUDENT, value: 'STUDENT' },
            { label: roleLabels.INSTRUCTOR, value: 'INSTRUCTOR' },
            { label: roleLabels.SUPER_ADMIN, value: 'SUPER_ADMIN' },
          ]}
        />
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

      <UsersTable
        items={tableRows}
        loading={loading}
        onDetail={goToDetail}
        onEdit={openEdit}
        onToggleStatus={toggleStatus}
        onDelete={setDeleteTarget}
      />

      <Modal
        isOpen={formOpen}
        title={editing ? t('admin.users.editUser') : t('admin.users.addUser')}
        onClose={() => { setFormOpen(false); setEditing(null); setForm(emptyForm); }}
      >
        <form className="stack-sm" onSubmit={saveUser}>
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
          <Select
            label={t('form.role')}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[
              { label: roleLabels.STUDENT, value: 'STUDENT' },
              { label: roleLabels.INSTRUCTOR, value: 'INSTRUCTOR' },
              { label: roleLabels.SUPER_ADMIN, value: 'SUPER_ADMIN' },
            ]}
            disabled={Boolean(editing)}
          />
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
            {editing ? t('actions.saveChanges') : t('admin.users.createUser')}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('admin.users.deleteTitle')}
        message={t('admin.users.deleteMessage', { name: deleteTarget?.fullName })}
        confirmLabel={t('actions.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
