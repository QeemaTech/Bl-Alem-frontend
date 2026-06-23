import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { UserDetailDashboard } from '../../components/admin/userDetail/UserDetailDashboard';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';

const emptyEditForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'STUDENT',
  status: 'ACTIVE',
  preferredLanguage: 'ar',
};

interface AdminAccountDetailViewProps {
  backTo: string;
  backLabel: string;
  fallbackPath: string;
  loadErrorToast: string;
  editDialogTitle: string;
  deleteDialogTitle: string;
  deleteSuccessToast: string;
  deleteErrorToast: string;
  onDelete: (id: number | string) => Promise<unknown>;
  roleLocked?: string;
  variant?: 'default' | 'instructor';
}

export function AdminAccountDetailView({
  backTo,
  backLabel,
  fallbackPath,
  loadErrorToast,
  editDialogTitle,
  deleteDialogTitle,
  deleteSuccessToast,
  deleteErrorToast,
  onDelete,
  roleLocked,
  variant = 'default',
}: AdminAccountDetailViewProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [newPassword, setNewPassword] = useState('');
  const [notifyForm, setNotifyForm] = useState({
    titleAr: '',
    bodyAr: '',
    type: 'ADMIN',
  });

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setData(await adminApi.user(id));
    } catch {
      showToast(loadErrorToast, 'error');
      navigate(fallbackPath);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const openEdit = () => {
    if (!data) return;
    setEditForm({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || '',
      password: '',
      role: roleLocked || data.role,
      status: data.status,
      preferredLanguage: data.preferredLanguage || 'ar',
    });
    setEditOpen(true);
  };

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        role: roleLocked || editForm.role,
        status: editForm.status,
        preferredLanguage: editForm.preferredLanguage,
      };
      if (editForm.password.trim()) payload.password = editForm.password.trim();
      await adminApi.updateUser(data.id, payload);
      showToast('تم حفظ التعديلات.', 'success');
      setEditOpen(false);
      await load();
    } catch {
      showToast('تعذّر حفظ البيانات.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const setStatus = async (status: 'ACTIVE' | 'SUSPENDED') => {
    if (!data) return;
    if (variant === 'instructor') {
      if (status === 'SUSPENDED') await adminApi.suspendInstructor(data.id);
      else await adminApi.activateInstructor(data.id);
    } else {
      await adminApi.userStatus(data.id, status);
    }
    showToast(status === 'ACTIVE' ? 'تم تفعيل الحساب.' : 'تم إيقاف الحساب.', 'success');
    await load();
  };

  const handleApprove = async () => {
    if (!data) return;
    await adminApi.approveInstructor(data.id);
    showToast('تم اعتماد المحاضر.', 'success');
    await load();
  };

  const handleReject = async (e: FormEvent) => {
    e.preventDefault();
    if (!data) return;
    await adminApi.rejectInstructor(data.id, rejectReason);
    showToast('تم رفض المحاضر.', 'success');
    setRejectOpen(false);
    setRejectReason('');
    await load();
  };

  const approval = data?.instructorProfile?.approvalStatus;
  const instructorExtraActions = variant === 'instructor' && approval === 'PENDING' ? (
    <>
      <Button size="sm" onClick={handleApprove}>اعتماد</Button>
      <Button size="sm" variant="danger" onClick={() => setRejectOpen(true)}>رفض</Button>
    </>
  ) : null;

  const showStatusToggle = variant !== 'instructor' || approval !== 'PENDING';
  const deleteDisabled = variant === 'instructor' && Number(data?._count?.courses || 0) > 0;

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!data || !newPassword.trim()) return;
    setSubmitting(true);
    try {
      await adminApi.updateUser(data.id, { password: newPassword.trim() });
      showToast('تم تحديث كلمة المرور.', 'success');
      setResetOpen(false);
      setNewPassword('');
    } catch {
      showToast('تعذّر تحديث كلمة المرور.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const sendNotification = async (e: FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSubmitting(true);
    try {
      await adminApi.sendNotification({
        targetType: 'SPECIFIC_USER',
        userId: String(data.id),
        titleAr: notifyForm.titleAr,
        bodyAr: notifyForm.bodyAr,
        type: notifyForm.type,
      });
      showToast('تم إرسال الإشعار.', 'success');
      setNotifyOpen(false);
      setNotifyForm({ titleAr: '', bodyAr: '', type: 'ADMIN' });
    } catch {
      showToast('تعذّر إرسال الإشعار.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!data) return;
    try {
      await onDelete(data.id);
      showToast(deleteSuccessToast, 'success');
      navigate(fallbackPath);
    } catch {
      showToast(deleteErrorToast, 'error');
      setDeleteOpen(false);
    }
  };

  return (
    <div className="page-grid admin-detail-page admin-user-detail-page">
      <div className="admin-detail-top">
        <Link to={backTo} className="admin-detail-back">
          <ArrowRight size={18} aria-hidden="true" />
          {backLabel}
        </Link>
      </div>

      {loading ? (
        <div className="admin-user-dashboard-skeleton">
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={4} />
          <LoadingSkeleton variant="card" count={2} />
        </div>
      ) : data ? (
        <UserDetailDashboard
          data={data}
          onEdit={openEdit}
          onSuspend={() => setStatus('SUSPENDED')}
          onActivate={() => setStatus('ACTIVE')}
          onResetPassword={() => setResetOpen(true)}
          onSendNotification={() => setNotifyOpen(true)}
          onDelete={() => setDeleteOpen(true)}
          extraHeroActions={instructorExtraActions}
          deleteDisabled={deleteDisabled}
          showStatusToggle={showStatusToggle}
        />
      ) : null}

      <Modal isOpen={editOpen} title={editDialogTitle} onClose={() => setEditOpen(false)}>
        <form className="stack-sm" onSubmit={saveEdit}>
          <Input label="الاسم" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} required />
          <Input label="البريد" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
          <Input label="الهاتف" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          {!roleLocked ? (
            <Select
              label="الدور"
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              options={[
                { label: 'طالب', value: 'STUDENT' },
                { label: 'محاضر', value: 'INSTRUCTOR' },
                { label: 'مشرف', value: 'SUPER_ADMIN' },
              ]}
            />
          ) : null}
          <Select
            label="الحالة"
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            options={[
              { label: 'نشط', value: 'ACTIVE' },
              { label: 'موقوف', value: 'SUSPENDED' },
              { label: 'بانتظار التفعيل', value: 'PENDING' },
            ]}
          />
          <Input
            label="كلمة مرور جديدة (اختياري)"
            type="password"
            value={editForm.password}
            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
          />
          <Button loading={submitting}>حفظ التعديلات</Button>
        </form>
      </Modal>

      <Modal isOpen={resetOpen} title="إعادة تعيين كلمة المرور" onClose={() => setResetOpen(false)}>
        <form className="stack-sm" onSubmit={handleResetPassword}>
          <Input
            label="كلمة المرور الجديدة"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Button loading={submitting}>تحديث كلمة المرور</Button>
        </form>
      </Modal>

      <Modal isOpen={notifyOpen} title="إرسال إشعار" onClose={() => setNotifyOpen(false)}>
        <form className="stack-sm" onSubmit={sendNotification}>
          <Select
            label="نوع الإشعار"
            value={notifyForm.type}
            onChange={(e) => setNotifyForm({ ...notifyForm, type: e.target.value })}
            options={[
              { label: 'إداري', value: 'ADMIN' },
              { label: 'ترحيب', value: 'WELCOME' },
              { label: 'دفع', value: 'PAYMENT' },
              { label: 'كورس', value: 'COURSE' },
            ]}
          />
          <Input label="العنوان" value={notifyForm.titleAr} onChange={(e) => setNotifyForm({ ...notifyForm, titleAr: e.target.value })} required />
          <Textarea label="نص الإشعار" value={notifyForm.bodyAr} onChange={(e) => setNotifyForm({ ...notifyForm, bodyAr: e.target.value })} required />
          <Button loading={submitting}>إرسال الإشعار</Button>
        </form>
      </Modal>

      <Modal isOpen={rejectOpen} title="رفض المحاضر" onClose={() => { setRejectOpen(false); setRejectReason(''); }}>
        <form className="stack-sm" onSubmit={handleReject}>
          <Textarea label="سبب الرفض" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required />
          <Button variant="danger" loading={submitting}>تأكيد الرفض</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        title={deleteDialogTitle}
        message={`هل أنت متأكد من حذف "${data?.fullName}"؟`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
