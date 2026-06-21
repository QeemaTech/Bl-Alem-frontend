import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  enrollmentLabels,
  fmtDate,
  fmtMoney,
  formatInterests,
} from '../../utils/adminFormatters';

export default function AdminStudentDetailPage() {
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
      setData(await adminApi.student(id));
    } catch {
      showToast('تعذّر تحميل بيانات الطالب.', 'error');
      navigate('/admin/students');
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
      await adminApi.deleteStudent(data.id);
      showToast('تم حذف الطالب.', 'success');
      navigate('/admin/students');
    } catch {
      showToast('تعذّر حذف الطالب.', 'error');
      setDeleteOpen(false);
    }
  };

  return (
    <AdminDetailShell
      title={data?.fullName || 'تفاصيل الطالب'}
      subtitle={data?.email}
      backTo="/admin/students"
      backLabel="العودة للطلاب"
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
              <DetailRow label="المستوى التعليمي">{data.studentProfile?.educationLevel || '—'}</DetailRow>
              <DetailRow label="الاهتمامات">{formatInterests(data.studentProfile?.interests)}</DetailRow>
              <DetailRow label="رصيد المحفظة">{fmtMoney(Number(data.wallet?.balance || 0))}</DetailRow>
              <DetailRow label="الحالة">
                <Badge variant={accountStatusVariant(data.status)}>
                  {accountStatusLabels[data.status] || data.status}
                </Badge>
              </DetailRow>
              {data.studentProfile?.bio ? <DetailRow label="نبذة">{data.studentProfile.bio}</DetailRow> : null}
              <DetailRow label="تاريخ الانضمام">{fmtDate(data.createdAt)}</DetailRow>
            </div>
          </Card>

          {data.enrollments?.length ? (
            <Card className="admin-detail-card">
              <DetailSection title={`الاشتراكات (${data.enrollments.length})`}>
                <div className="admin-detail-list">
                  {data.enrollments.map((enrollment: any) => (
                    <div key={enrollment.id} className="admin-detail-list-item">
                      <span>{enrollment.course?.titleAr || '—'}</span>
                      <Badge variant="default">{enrollmentLabels[enrollment.status] || enrollment.status}</Badge>
                    </div>
                  ))}
                </div>
              </DetailSection>
            </Card>
          ) : null}

          {data.payments?.length ? (
            <Card className="admin-detail-card">
              <DetailSection title="آخر المدفوعات">
                <div className="admin-detail-list">
                  {data.payments.map((payment: any) => (
                    <div key={payment.id} className="admin-detail-list-item">
                      <span>{payment.course?.titleAr || '—'}</span>
                      <strong>{fmtMoney(Number(payment.finalAmount))}</strong>
                    </div>
                  ))}
                </div>
              </DetailSection>
            </Card>
          ) : null}

          {data.certificates?.length ? (
            <Card className="admin-detail-card">
              <DetailSection title={`الشهادات (${data.certificates.length})`}>
                <div className="admin-detail-list">
                  {data.certificates.map((cert: any) => (
                    <div key={cert.id} className="admin-detail-list-item">
                      <span>{cert.course?.titleAr || '—'}</span>
                      <span>{cert.certificateNumber}</span>
                    </div>
                  ))}
                </div>
              </DetailSection>
            </Card>
          ) : null}

          <Card className="admin-detail-card">
            <DetailSection title="روابط سريعة">
              <div className="chip-row">
                <Link to={`/admin/users/${data.id}`}><Button variant="outline">عرض كمستخدم</Button></Link>
              </div>
            </DetailSection>
          </Card>
        </>
      ) : null}

      <ConfirmDialog
        isOpen={deleteOpen}
        title="حذف الطالب"
        message={`هل أنت متأكد من حذف "${data?.fullName}"؟`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </AdminDetailShell>
  );
}
