import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from '@/icons';
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
import { useAdminNotificationLabels } from '../../hooks/useAdminNotificationLabels';
import { useAdminUserLabels } from '../../hooks/useAdminUserLabels';

const emptyEditForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'STUDENT',
  status: 'ACTIVE',
  preferredLanguage: 'ar',
};

const VARIANT_PATHS = {
  user: { backTo: '/admin/users', fallbackPath: '/admin/users' },
  student: { backTo: '/admin/students', fallbackPath: '/admin/students' },
  instructor: { backTo: '/admin/instructors', fallbackPath: '/admin/instructors' },
} as const;

interface AdminAccountDetailViewProps {
  variant: 'user' | 'student' | 'instructor';
  onDelete: (id: number | string) => Promise<unknown>;
  roleLocked?: string;
}

export function AdminAccountDetailView({
  variant,
  onDelete,
  roleLocked,
}: AdminAccountDetailViewProps) {
  const { t } = useTranslation('users');
  const { typeLabels } = useAdminNotificationLabels();
  const { roleLabels, accountStatusLabels } = useAdminUserLabels();
  const { backTo, fallbackPath } = VARIANT_PATHS[variant];
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
      showToast(t(`admin.detail.loadError.${variant}`), 'error');
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
      showToast(t('admin.detail.toast.saved'), 'success');
      setEditOpen(false);
      await load();
    } catch {
      showToast(t('admin.detail.toast.saveError'), 'error');
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
    showToast(
      status === 'ACTIVE' ? t('admin.detail.toast.activated') : t('admin.detail.toast.suspended'),
      'success',
    );
    await load();
  };

  const handleApprove = async () => {
    if (!data) return;
    await adminApi.approveInstructor(data.id);
    showToast(t('admin.detail.toast.approved'), 'success');
    await load();
  };

  const handleReject = async (e: FormEvent) => {
    e.preventDefault();
    if (!data) return;
    await adminApi.rejectInstructor(data.id, rejectReason);
    showToast(t('admin.detail.toast.rejected'), 'success');
    setRejectOpen(false);
    setRejectReason('');
    await load();
  };

  const approval = data?.instructorProfile?.approvalStatus;
  const instructorExtraActions = variant === 'instructor' && approval === 'PENDING' ? (
    <>
      <Button size="sm" onClick={handleApprove}>{t('actions.approve')}</Button>
      <Button size="sm" variant="danger" onClick={() => setRejectOpen(true)}>{t('actions.reject')}</Button>
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
      showToast(t('admin.detail.toast.passwordUpdated'), 'success');
      setResetOpen(false);
      setNewPassword('');
    } catch {
      showToast(t('admin.detail.toast.passwordError'), 'error');
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
      showToast(t('admin.detail.toast.notificationSent'), 'success');
      setNotifyOpen(false);
      setNotifyForm({ titleAr: '', bodyAr: '', type: 'ADMIN' });
    } catch {
      showToast(t('admin.detail.toast.notificationError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!data) return;
    try {
      await onDelete(data.id);
      showToast(t(`admin.detail.deleteSuccess.${variant}`), 'success');
      navigate(fallbackPath);
    } catch {
      showToast(t(`admin.detail.deleteError.${variant}`), 'error');
      setDeleteOpen(false);
    }
  };

  const notifyTypeOptions = ['ADMIN', 'WELCOME', 'PAYMENT', 'COURSE'].map((type) => ({
    label: typeLabels[type] || type,
    value: type,
  }));

  return (
    <div className="page-grid admin-detail-page admin-user-detail-page">
      <div className="admin-detail-top">
        <Link to={backTo} className="admin-detail-back">
          <ArrowRight size={18} aria-hidden="true" />
          {t(`admin.detail.back.${variant}`)}
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

      <Modal isOpen={editOpen} title={t(`admin.detail.editDialog.${variant}`)} onClose={() => setEditOpen(false)}>
        <form className="stack-sm" onSubmit={saveEdit}>
          <Input label={t('form.fullName')} value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} required />
          <Input label={t('form.email')} type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
          <Input label={t('form.phone')} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          {!roleLocked ? (
            <Select
              label={t('filters.role')}
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              options={[
                { label: roleLabels.STUDENT, value: 'STUDENT' },
                { label: roleLabels.INSTRUCTOR, value: 'INSTRUCTOR' },
                { label: roleLabels.SUPER_ADMIN, value: 'SUPER_ADMIN' },
              ]}
            />
          ) : null}
          <Select
            label={t('filters.accountStatus')}
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            options={[
              { label: accountStatusLabels.ACTIVE, value: 'ACTIVE' },
              { label: accountStatusLabels.SUSPENDED, value: 'SUSPENDED' },
              { label: accountStatusLabels.PENDING, value: 'PENDING' },
            ]}
          />
          <Input
            label={t('admin.detail.modals.newPasswordOptional')}
            type="password"
            value={editForm.password}
            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
          />
          <Button type="submit" loading={submitting}>{t('actions.saveChanges')}</Button>
        </form>
      </Modal>

      <Modal isOpen={resetOpen} title={t('admin.detail.modals.resetPassword.title')} onClose={() => setResetOpen(false)}>
        <form className="stack-sm" onSubmit={handleResetPassword}>
          <Input
            label={t('admin.detail.modals.resetPassword.newPassword')}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Button type="submit" loading={submitting}>{t('admin.detail.modals.resetPassword.submit')}</Button>
        </form>
      </Modal>

      <Modal isOpen={notifyOpen} title={t('admin.detail.modals.notify.title')} onClose={() => setNotifyOpen(false)}>
        <form className="stack-sm" onSubmit={sendNotification}>
          <Select
            label={t('admin.detail.modals.notify.type')}
            value={notifyForm.type}
            onChange={(e) => setNotifyForm({ ...notifyForm, type: e.target.value })}
            options={notifyTypeOptions}
          />
          <Input label={t('admin.detail.modals.notify.titleField')} value={notifyForm.titleAr} onChange={(e) => setNotifyForm({ ...notifyForm, titleAr: e.target.value })} required />
          <Textarea label={t('admin.detail.modals.notify.body')} value={notifyForm.bodyAr} onChange={(e) => setNotifyForm({ ...notifyForm, bodyAr: e.target.value })} required />
          <Button type="submit" loading={submitting}>{t('admin.detail.modals.notify.submit')}</Button>
        </form>
      </Modal>

      <Modal isOpen={rejectOpen} title={t('admin.detail.modals.reject.title')} onClose={() => { setRejectOpen(false); setRejectReason(''); }}>
        <form className="stack-sm" onSubmit={handleReject}>
          <Textarea label={t('form.rejectReason')} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required />
          <Button variant="danger" loading={submitting}>{t('actions.confirmReject')}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        title={t(`admin.detail.deleteDialog.${variant}`)}
        message={t('admin.detail.deleteConfirmMessage', { name: data?.fullName })}
        confirmLabel={t('actions.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
