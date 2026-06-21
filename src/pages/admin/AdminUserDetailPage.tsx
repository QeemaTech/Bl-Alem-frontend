import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { AdminDetailShell, DetailRow, DetailSection } from '../../components/admin/AdminDetailShell';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import {
  accountStatusLabels,
  accountStatusVariant,
  fmtDate,
  fmtMoney,
  roleLabels,
  roleVariant,
} from '../../utils/adminFormatters';

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setData(await adminApi.user(id));
    } catch {
      showToast('تعذّر تحميل بيانات المستخدم.', 'error');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const toggleStatus = async () => {
    if (!data) return;
    const next = data.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await adminApi.userStatus(data.id, next);
    showToast(next === 'ACTIVE' ? 'تم تفعيل الحساب.' : 'تم إيقاف الحساب.', 'success');
    await load();
  };

  const handleDelete = async () => {
    if (!data) return;
    try {
      await adminApi.deleteUser(data.id);
      showToast('تم حذف المستخدم.', 'success');
      navigate('/admin/users');
    } catch {
      showToast('تعذّر حذف المستخدم.', 'error');
      setDeleteOpen(false);
    }
  };

  return (
    <AdminDetailShell
      title={data?.fullName || 'تفاصيل المستخدم'}
      subtitle={data?.email}
      backTo="/admin/users"
      backLabel="العودة للمستخدمين"
      loading={loading}
      actions={data ? (
        <>
          <Button variant="secondary" onClick={toggleStatus}>
            {data.status === 'ACTIVE' ? 'إيقاف الحساب' : 'تفعيل الحساب'}
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>حذف</Button>
        </>
      ) : null}
    >
      {data ? (
        <>
          <Card className="admin-detail-card">
            <div className="admin-detail-grid">
              <DetailRow label="الاسم">{data.fullName}</DetailRow>
              <DetailRow label="البريد">{data.email}</DetailRow>
              <DetailRow label="الهاتف"><span dir="ltr">{data.phone || '—'}</span></DetailRow>
              <DetailRow label="الدور">
                <Badge variant={roleVariant(data.role)}>{roleLabels[data.role] || data.role}</Badge>
              </DetailRow>
              <DetailRow label="الحالة">
                <Badge variant={accountStatusVariant(data.status)}>
                  {accountStatusLabels[data.status] || data.status}
                </Badge>
              </DetailRow>
              <DetailRow label="رصيد المحفظة">{fmtMoney(Number(data.wallet?.balance || 0))}</DetailRow>
              <DetailRow label="اللغة المفضلة">{data.preferredLanguage === 'ar' ? 'العربية' : data.preferredLanguage}</DetailRow>
              <DetailRow label="تاريخ التسجيل">{fmtDate(data.createdAt)}</DetailRow>
              <DetailRow label="الإحصائيات">
                {data._count?.enrollments ?? 0} اشتراك · {data._count?.courses ?? 0} كورس · {data._count?.payments ?? 0} دفعة
              </DetailRow>
            </div>
          </Card>

          {data.role === 'INSTRUCTOR' && data.instructorProfile ? (
            <Card className="admin-detail-card">
              <DetailSection title="بيانات المحاضر">
                <div className="admin-detail-grid">
                  <DetailRow label="حالة الاعتماد">{data.instructorProfile.approvalStatus}</DetailRow>
                  <DetailRow label="التخصص">{data.instructorProfile.specialization || '—'}</DetailRow>
                  <DetailRow label="المسمى">{data.instructorProfile.title || '—'}</DetailRow>
                  <DetailRow label="سنوات الخبرة">{data.instructorProfile.yearsOfExperience ?? '—'}</DetailRow>
                  {data.instructorProfile.bio ? <DetailRow label="نبذة">{data.instructorProfile.bio}</DetailRow> : null}
                </div>
              </DetailSection>
            </Card>
          ) : null}

          {data.role === 'STUDENT' && data.studentProfile ? (
            <Card className="admin-detail-card">
              <DetailSection title="بيانات الطالب">
                <div className="admin-detail-grid">
                  <DetailRow label="المستوى التعليمي">{data.studentProfile.educationLevel || '—'}</DetailRow>
                  {data.studentProfile.bio ? <DetailRow label="نبذة">{data.studentProfile.bio}</DetailRow> : null}
                </div>
              </DetailSection>
            </Card>
          ) : null}
        </>
      ) : null}

      <ConfirmDialog
        isOpen={deleteOpen}
        title="حذف المستخدم"
        message={`هل أنت متأكد من حذف "${data?.fullName}"؟`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </AdminDetailShell>
  );
}
