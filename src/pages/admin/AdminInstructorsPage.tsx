import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Download, GraduationCap, Plus, Users, Wallet } from '@/icons';
import { adminApi } from '../../api/admin';
import { InstructorsTable } from '../../components/admin/users/InstructorsTable';
import { approvalLabels, fmtDate, statusLabels } from '../../components/admin/users/userShared';
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
import { exportTableToExcel } from '../../utils/exportExcel';
import { fmtMoney } from '../../utils/adminFormatters';

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

const exportColumns = [
  { key: 'id', header: 'رقم المحاضر' },
  { key: 'fullName', header: 'الاسم' },
  { key: 'email', header: 'البريد' },
  { key: 'phone', header: 'الهاتف' },
  { key: 'title', header: 'المسمى' },
  { key: 'specialization', header: 'التخصص' },
  { key: 'courses', header: 'الكورسات' },
  { key: 'students', header: 'الطلاب' },
  { key: 'earnings', header: 'الأرباح' },
  { key: 'approvalStatus', header: 'حالة الاعتماد' },
  { key: 'accountStatus', header: 'حالة الحساب' },
  { key: 'joinedAt', header: 'تاريخ الانضمام' },
];

export default function AdminInstructorsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
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
      const label = approvalLabels[i.instructorProfile?.approvalStatus] || '—';
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [items]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone || '—',
    title: row.instructorProfile?.title || '—',
    specialization: row.instructorProfile?.specialization || '—',
    courses: String(row._count?.courses ?? 0),
    students: String(row.instructorProfile?.totalStudents ?? 0),
    earnings: fmtMoney(Number(row.instructorProfile?.totalEarnings || 0)),
    approvalStatus: approvalLabels[row.instructorProfile?.approvalStatus] || '—',
    accountStatus: statusLabels[row.status] || row.status,
    joinedAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems]);

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
        showToast('تم تحديث المحاضر.', 'success');
      } else {
        payload.password = form.password.trim() || 'Password123!';
        await adminApi.createInstructor(payload);
        showToast('تم إنشاء المحاضر.', 'success');
      }
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch {
      showToast('تعذّر حفظ بيانات المحاضر.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (instructor: any) => {
    await adminApi.approveInstructor(instructor.id);
    showToast('تم اعتماد المحاضر.', 'success');
    await load();
  };

  const handleReject = async (e: FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    await adminApi.rejectInstructor(rejectTarget.id, rejectReason);
    showToast('تم رفض المحاضر.', 'success');
    setRejectTarget(null);
    setRejectReason('');
    await load();
  };

  const handleSuspend = async (instructor: any) => {
    await adminApi.suspendInstructor(instructor.id);
    showToast('تم إيقاف المحاضر.', 'success');
    await load();
  };

  const handleActivate = async (instructor: any) => {
    await adminApi.activateInstructor(instructor.id);
    showToast('تم تفعيل المحاضر.', 'success');
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteInstructor(deleteTarget.id);
      showToast('تم حذف المحاضر.', 'success');
      setDeleteTarget(null);
      await load();
    } catch {
      showToast('لا يمكن حذف محاضر لديه دورات.', 'error');
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    exportTableToExcel('المحاضرون', exportColumns, tableRows.map(({ _raw, ...row }) => row));
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title="المحاضرون" subtitle="إدارة حسابات المحاضرين واعتماد طلباتهم" />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
          <Button icon={<Plus size={18} />} onClick={openCreate}>
            إضافة محاضر
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي المحاضرين" value={String(stats.total)} icon={GraduationCap} />
        <StatCard title="قيد المراجعة" value={String(stats.pending)} icon={Users} />
        <StatCard title="معتمدون" value={String(stats.approved)} icon={GraduationCap} />
        <StatCard title="مرفوضون / موقوفون" value={String(stats.rejected + stats.suspended)} icon={Users} />
        <StatCard title="إجمالي الكورسات" value={String(stats.courses)} icon={BookOpen} />
        <StatCard title="إجمالي الأرباح" value={fmtMoney(stats.earnings)} icon={Wallet} />
      </div>

      <div className="reports-charts-grid">
        <ReportChart title="توزيع حالات الاعتماد" type="pie" data={approvalChart} />
      </div>

      <FilterBar
        className="filter-bar--modern"
        searchValue={search}
        searchPlaceholder="بحث بالاسم، البريد، التخصص..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setApprovalFilter(''); setAccountFilter(''); }}
        resetDisabled={!hasActiveFilters}
        searchIconSize={20}
      >
        <Select
          label="حالة الاعتماد"
          value={approvalFilter}
          onChange={(e) => setApprovalFilter(e.target.value)}
          options={[
            { label: 'كل الحالات', value: '' },
            { label: 'قيد المراجعة', value: 'PENDING' },
            { label: 'معتمد', value: 'APPROVED' },
            { label: 'مرفوض', value: 'REJECTED' },
            { label: 'موقوف', value: 'SUSPENDED' },
          ]}
        />
        <Select
          label="حالة الحساب"
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          options={[
            { label: 'كل الحسابات', value: '' },
            { label: 'نشط', value: 'ACTIVE' },
            { label: 'بانتظار التفعيل', value: 'PENDING' },
            { label: 'موقوف', value: 'SUSPENDED' },
            { label: 'مرفوض', value: 'REJECTED' },
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
        title={editing ? 'تعديل المحاضر' : 'إضافة محاضر'}
        onClose={() => { setFormOpen(false); setEditing(null); setForm(emptyForm); }}
      >
        <form className="stack-sm" onSubmit={saveInstructor}>
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
          <Input label="المسمى الوظيفي" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="خبير JavaScript" />
          <Input label="التخصص" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
          <Input label="سنوات الخبرة" type="number" min="0" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} />
          <Textarea label="نبذة" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
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
            label="حالة الاعتماد"
            value={form.approvalStatus}
            onChange={(e) => setForm({ ...form, approvalStatus: e.target.value })}
            options={[
              { label: 'قيد المراجعة', value: 'PENDING' },
              { label: 'معتمد', value: 'APPROVED' },
              { label: 'مرفوض', value: 'REJECTED' },
              { label: 'موقوف', value: 'SUSPENDED' },
            ]}
          />
          <Button loading={submitting}>{editing ? 'حفظ التعديلات' : 'إنشاء المحاضر'}</Button>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(rejectTarget)}
        title="رفض المحاضر"
        onClose={() => { setRejectTarget(null); setRejectReason(''); }}
      >
        <form className="stack-sm" onSubmit={handleReject}>
          <p>رفض طلب: <strong>{rejectTarget?.fullName}</strong></p>
          <Textarea label="سبب الرفض" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required />
          <Button variant="danger">تأكيد الرفض</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="حذف المحاضر"
        message={`هل أنت متأكد من حذف "${deleteTarget?.fullName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
