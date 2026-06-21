import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { AdminDetailShell, DetailRow, DetailSection } from '../../components/admin/AdminDetailShell';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import {
  accountStatusLabels,
  accountStatusVariant,
  approvalLabels,
  approvalVariant,
  fmtDate,
  fmtMoney,
} from '../../utils/adminFormatters';

export default function AdminInstructorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setData(await adminApi.instructor(id));
    } catch {
      showToast('تعذّر تحميل بيانات المحاضر.', 'error');
      navigate('/admin/instructors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

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

  const handleSuspend = async () => {
    if (!data) return;
    await adminApi.suspendInstructor(data.id);
    showToast('تم إيقاف المحاضر.', 'success');
    await load();
  };

  const handleActivate = async () => {
    if (!data) return;
    await adminApi.activateInstructor(data.id);
    showToast('تم تفعيل المحاضر.', 'success');
    await load();
  };

  const handleDelete = async () => {
    if (!data) return;
    try {
      await adminApi.deleteInstructor(data.id);
      showToast('تم حذف المحاضر.', 'success');
      navigate('/admin/instructors');
    } catch {
      showToast('لا يمكن حذف محاضر لديه دورات.', 'error');
      setDeleteOpen(false);
    }
  };

  const approval = data?.instructorProfile?.approvalStatus;

  return (
    <AdminDetailShell
      title={data?.fullName || 'تفاصيل المحاضر'}
      subtitle={data?.instructorProfile?.specialization || data?.email}
      backTo="/admin/instructors"
      backLabel="العودة للمحاضرين"
      loading={loading}
      actions={data ? (
        <>
          {approval === 'PENDING' ? (
            <>
              <Button onClick={handleApprove}>اعتماد</Button>
              <Button variant="danger" onClick={() => setRejectOpen(true)}>رفض</Button>
            </>
          ) : null}
          {approval === 'APPROVED' && data.status === 'ACTIVE' ? (
            <Button variant="secondary" onClick={handleSuspend}>إيقاف</Button>
          ) : null}
          {['SUSPENDED', 'REJECTED'].includes(approval) || data.status === 'SUSPENDED' ? (
            <Button variant="secondary" onClick={handleActivate}>تفعيل</Button>
          ) : null}
          <Button
            variant="danger"
            onClick={() => setDeleteOpen(true)}
            disabled={Number(data._count?.courses || 0) > 0}
          >
            حذف
          </Button>
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
              <DetailRow label="المسمى">{data.instructorProfile?.title || '—'}</DetailRow>
              <DetailRow label="التخصص">{data.instructorProfile?.specialization || '—'}</DetailRow>
              <DetailRow label="سنوات الخبرة">{data.instructorProfile?.yearsOfExperience ?? '—'}</DetailRow>
              <DetailRow label="الطلاب">{data.instructorProfile?.totalStudents ?? 0}</DetailRow>
              <DetailRow label="الأرباح">{fmtMoney(Number(data.instructorProfile?.totalEarnings || 0))}</DetailRow>
              <DetailRow label="رصيد المحفظة">{fmtMoney(Number(data.wallet?.balance || 0))}</DetailRow>
              <DetailRow label="حالة الاعتماد">
                <Badge variant={approvalVariant(data.instructorProfile?.approvalStatus)}>
                  {approvalLabels[data.instructorProfile?.approvalStatus] || '—'}
                </Badge>
              </DetailRow>
              <DetailRow label="حالة الحساب">
                <Badge variant={accountStatusVariant(data.status)}>
                  {accountStatusLabels[data.status] || data.status}
                </Badge>
              </DetailRow>
              {data.instructorProfile?.rejectionReason ? (
                <DetailRow label="سبب الرفض">{data.instructorProfile.rejectionReason}</DetailRow>
              ) : null}
              {data.instructorProfile?.bio ? <DetailRow label="نبذة">{data.instructorProfile.bio}</DetailRow> : null}
              <DetailRow label="تاريخ الانضمام">{fmtDate(data.createdAt)}</DetailRow>
            </div>
          </Card>

          {data.courses?.length ? (
            <Card className="admin-detail-card">
              <DetailSection title={`الكورسات (${data.courses.length})`}>
                <div className="admin-detail-list">
                  {data.courses.map((course: any) => (
                    <Link key={course.id} to={`/admin/course-review/${course.id}`} className="admin-detail-list-item admin-detail-list-link">
                      <span>{course.titleAr}</span>
                      <span>{course.totalStudents ?? 0} طالب</span>
                    </Link>
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

      <Modal isOpen={rejectOpen} title="رفض المحاضر" onClose={() => { setRejectOpen(false); setRejectReason(''); }}>
        <form className="stack-sm" onSubmit={handleReject}>
          <Textarea label="سبب الرفض" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required />
          <Button variant="danger">تأكيد الرفض</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        title="حذف المحاضر"
        message={`هل أنت متأكد من حذف "${data?.fullName}"؟`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </AdminDetailShell>
  );
}
