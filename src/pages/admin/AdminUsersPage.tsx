import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Shield, UserCheck, Users } from '@/icons';
import { adminApi } from '../../api/admin';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterBar } from '../../components/ui/FilterBar';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { TableEntityLink } from '../../components/ui/TableEntityLink';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';

const roleLabels: Record<string, string> = {
  STUDENT: 'طالب',
  INSTRUCTOR: 'محاضر',
  SUPER_ADMIN: 'مشرف',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  PENDING: 'بانتظار التفعيل',
  SUSPENDED: 'موقوف',
  REJECTED: 'مرفوض',
};

const statusVariant = (status: string) => {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'SUSPENDED') return 'suspended' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  return 'default' as const;
};

const roleVariant = (role: string) => {
  if (role === 'SUPER_ADMIN') return 'warning' as const;
  if (role === 'INSTRUCTOR') return 'info' as const;
  return 'default' as const;
};

const fmtMoney = (value: number) => `${Number(value || 0).toLocaleString('ar-SA')} ر.س`;

const fmtDate = (value?: string | null) => (value
  ? new Date(value).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
  : '—');

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'STUDENT',
  status: 'ACTIVE',
  preferredLanguage: 'ar',
};

const exportColumns = [
  { key: 'id', header: 'رقم المستخدم' },
  { key: 'fullName', header: 'الاسم' },
  { key: 'email', header: 'البريد' },
  { key: 'phone', header: 'الهاتف' },
  { key: 'role', header: 'الدور' },
  { key: 'status', header: 'الحالة' },
  { key: 'wallet', header: 'المحفظة' },
  { key: 'activity', header: 'النشاط' },
  { key: 'joinedAt', header: 'تاريخ التسجيل' },
];

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
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
      const label = roleLabels[i.role] || i.role;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [items]);

  const statusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const label = statusLabels[i.status] || i.status;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [items]);

  const activityLabel = (user: any) => {
    if (user.role === 'INSTRUCTOR') return `${user._count?.courses ?? 0} كورس`;
    if (user.role === 'STUDENT') return `${user._count?.enrollments ?? 0} اشتراك`;
    return '—';
  };

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone || '—',
    role: roleLabels[row.role] || row.role,
    status: statusLabels[row.status] || row.status,
    wallet: fmtMoney(Number(row.wallet?.balance || 0)),
    activity: activityLabel(row),
    joinedAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems]);

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
      preferredLanguage: user.preferredLanguage || 'ar',
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
        preferredLanguage: form.preferredLanguage,
      };
      if (editing) {
        if (form.password.trim()) payload.password = form.password;
        await adminApi.updateUser(editing.id, payload);
        showToast('تم تحديث المستخدم.', 'success');
      } else {
        payload.password = form.password.trim() || 'Password123!';
        await adminApi.createUser(payload);
        showToast('تم إنشاء المستخدم.', 'success');
      }
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch {
      showToast('تعذّر حفظ بيانات المستخدم.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (user: any) => {
    const next = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await adminApi.userStatus(user.id, next);
    showToast(next === 'ACTIVE' ? 'تم تفعيل الحساب.' : 'تم إيقاف الحساب.', 'success');
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteUser(deleteTarget.id);
      showToast('تم حذف المستخدم.', 'success');
      setDeleteTarget(null);
      await load();
    } catch {
      showToast('تعذّر حذف المستخدم.', 'error');
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    exportTableToExcel('المستخدمون', exportColumns, tableRows.map(({ _raw, ...row }) => row));
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title="المستخدمون" subtitle="إدارة جميع حسابات المنصة" />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
          <Button icon={<Plus size={18} />} onClick={openCreate}>
            إضافة مستخدم
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي المستخدمين" value={String(stats.total)} icon={Users} />
        <StatCard title="الطلاب" value={String(stats.students)} icon={UserCheck} />
        <StatCard title="المحاضرون" value={String(stats.instructors)} icon={Users} />
        <StatCard title="المشرفون" value={String(stats.admins)} icon={Shield} />
        <StatCard title="نشطون" value={String(stats.active)} icon={UserCheck} />
        <StatCard title="موقوفون" value={String(stats.suspended)} icon={Users} />
      </div>

      <div className="reports-charts-grid">
        <ReportChart title="توزيع الأدوار" type="pie" data={roleChart} />
        <ReportChart title="توزيع حالات الحسابات" type="pie" data={statusChart} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالاسم، البريد، أو الهاتف..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}
      >
        <Select
          label="الدور"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={[
            { label: 'كل الأدوار', value: '' },
            { label: 'طالب', value: 'STUDENT' },
            { label: 'محاضر', value: 'INSTRUCTOR' },
            { label: 'مشرف', value: 'SUPER_ADMIN' },
          ]}
        />
        <Select
          label="الحالة"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'كل الحالات', value: '' },
            { label: 'نشط', value: 'ACTIVE' },
            { label: 'بانتظار التفعيل', value: 'PENDING' },
            { label: 'موقوف', value: 'SUSPENDED' },
            { label: 'مرفوض', value: 'REJECTED' },
          ]}
        />
      </FilterBar>

      <Card>
        <Table
          loading={loading}
          data={tableRows}
          onRowClick={(row) => goToDetail(row._raw)}
          emptyTitle="لا يوجد مستخدمون"
          emptyDescription="أضف مستخدماً جديداً للبدء."
          columns={[
            {
              key: 'fullName',
              header: 'الاسم',
              render: (row) => (
                <TableEntityLink to={`/admin/users/${row._raw.id}`}>
                  {row.fullName}
                </TableEntityLink>
              ),
            },
            { key: 'email', header: 'البريد' },
            { key: 'phone', header: 'الهاتف' },
            {
              key: 'role',
              header: 'الدور',
              render: (row) => (
                <Badge variant={roleVariant(String(row._raw?.role))}>
                  {roleLabels[String(row._raw?.role)] || row.role}
                </Badge>
              ),
            },
            {
              key: 'status',
              header: 'الحالة',
              render: (row) => (
                <Badge variant={statusVariant(String(row._raw?.status))}>
                  {statusLabels[String(row._raw?.status)] || row.status}
                </Badge>
              ),
            },
            { key: 'wallet', header: 'المحفظة' },
            { key: 'activity', header: 'النشاط' },
            { key: 'joinedAt', header: 'تاريخ التسجيل' },
            {
              key: 'actions',
              header: 'الإجراءات',
              render: (row) => {
                const user = row._raw;
                return (
                  <div className="card-actions" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => goToDetail(user)}>
                      التفاصيل
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                      تعديل
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toggleStatus(user)}>
                      {user.status === 'ACTIVE' ? 'إيقاف' : 'تفعيل'}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(user)}>
                      حذف
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      </Card>

      <Modal
        isOpen={formOpen}
        title={editing ? 'تعديل المستخدم' : 'إضافة مستخدم'}
        onClose={() => { setFormOpen(false); setEditing(null); setForm(emptyForm); }}
      >
        <form className="stack-sm" onSubmit={saveUser}>
          <Input label="الاسم الكامل" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <Input label="البريد الإلكتروني" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
          <Input
            label={editing ? 'كلمة المرور (اتركها فارغة بدون تغيير)' : 'كلمة المرور'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editing}
          />
          <Select
            label="الدور"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[
              { label: 'طالب', value: 'STUDENT' },
              { label: 'محاضر', value: 'INSTRUCTOR' },
              { label: 'مشرف', value: 'SUPER_ADMIN' },
            ]}
            disabled={Boolean(editing)}
          />
          <Select
            label="حالة الحساب"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { label: 'نشط', value: 'ACTIVE' },
              { label: 'بانتظار التفعيل', value: 'PENDING' },
              { label: 'موقوف', value: 'SUSPENDED' },
              { label: 'مرفوض', value: 'REJECTED' },
            ]}
          />
          <Select
            label="اللغة المفضلة"
            value={form.preferredLanguage}
            onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
            options={[
              { label: 'العربية', value: 'ar' },
              { label: 'English', value: 'en' },
            ]}
          />
          <Button loading={submitting}>{editing ? 'حفظ التعديلات' : 'إنشاء المستخدم'}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="حذف المستخدم"
        message={`هل أنت متأكد من حذف "${deleteTarget?.fullName}"؟ سيتم حذف جميع بياناته.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
