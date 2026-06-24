import { useEffect, useMemo, useState } from 'react';
import { Award, Copy, Download, ExternalLink, Plus } from '@/icons';
import { adminApi } from '../../api/admin';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { certificatePdfUrl, certificateVerifyUrl } from '../../utils/certificateUrls';
import { exportTableToExcel } from '../../utils/exportExcel';

const fmtDate = (value: string) => new Date(value).toLocaleDateString('ar-SA', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const exportColumns = [
  { key: 'certificateNumber', header: 'رقم الشهادة' },
  { key: 'student', header: 'الطالب' },
  { key: 'email', header: 'البريد' },
  { key: 'course', header: 'الكورس' },
  { key: 'instructor', header: 'المحاضر' },
  { key: 'pdfStatus', header: 'ملف PDF' },
  { key: 'verifyUrl', header: 'رابط التحقق' },
  { key: 'issuedAt', header: 'تاريخ الإصدار' },
];

export default function AdminCertificatesPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [eligible, setEligible] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [pdfFilter, setPdfFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [issueOpen, setIssueOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const [certificates, pending] = await Promise.all([
      adminApi.certificates(),
      adminApi.certificateEligible(),
    ]);
    setItems(certificates);
    setEligible(pending);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (pdfFilter === 'yes') result = result.filter((i) => i.pdfUrl);
    if (pdfFilter === 'no') result = result.filter((i) => !i.pdfUrl);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [i.certificateNumber, i.user?.fullName, i.user?.email, i.course?.titleAr, i.course?.instructor?.fullName]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, pdfFilter, search]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      total: items.length,
      thisMonth: items.filter((i) => new Date(i.issuedAt) >= monthStart).length,
      withPdf: items.filter((i) => i.pdfUrl).length,
      pending: eligible.length,
    };
  }, [items, eligible]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    certificateNumber: row.certificateNumber,
    student: row.user?.fullName || '—',
    email: row.user?.email || '—',
    course: row.course?.titleAr || '—',
    instructor: row.course?.instructor?.fullName || '—',
    pdfStatus: row.pdfUrl ? 'متاح' : 'غير متاح',
    verifyUrl: certificateVerifyUrl(row.certificateNumber),
    issuedAt: fmtDate(row.issuedAt),
    _raw: row,
  })), [filteredItems]);

  const issueCertificate = async (enrollmentId: number) => {
    setGenerating(enrollmentId);
    try {
      await adminApi.generateCertificate(enrollmentId);
      showToast('تم إصدار الشهادة بنجاح.', 'success');
      await load();
    } finally {
      setGenerating(null);
    }
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    showToast('تم نسخ الرابط.', 'success');
  };

  const handleExport = () => {
    exportTableToExcel('الشهادات', exportColumns, tableRows.map(({ _raw, ...row }) => row));
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title="الشهادات"
          subtitle="إدارة وإصدار شهادات إتمام الدورات"
        />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
          <Button icon={<Plus size={18} />} onClick={() => setIssueOpen(true)}>
            إصدار شهادة
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي الشهادات" value={String(stats.total)} icon={Award} />
        <StatCard title="صادرة هذا الشهر" value={String(stats.thisMonth)} icon={Award} />
        <StatCard title="ملف PDF متاح" value={String(stats.withPdf)} icon={Download} />
        <StatCard title="بانتظار الإصدار" value={String(stats.pending)} icon={Plus} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث برقم الشهادة، الطالب، الكورس، أو المحاضر..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setPdfFilter(''); }}
      >
        <Select
          label="ملف PDF"
          value={pdfFilter}
          onChange={(e) => setPdfFilter(e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'متاح', value: 'yes' },
            { label: 'غير متاح', value: 'no' },
          ]}
        />
      </FilterBar>

      <Card>
        <Table
          loading={loading}
          data={tableRows}
          emptyTitle="لا توجد شهادات"
          emptyDescription="ستظهر الشهادات هنا بعد إصدارها للطلاب."
          columns={[
            { key: 'certificateNumber', header: 'رقم الشهادة' },
            { key: 'student', header: 'الطالب' },
            { key: 'course', header: 'الكورس' },
            { key: 'instructor', header: 'المحاضر' },
            {
              key: 'pdfStatus',
              header: 'PDF',
              render: (row) => (
                <Badge variant={row._raw?.pdfUrl ? 'success' : 'warning'}>
                  {row.pdfStatus}
                </Badge>
              ),
            },
            { key: 'issuedAt', header: 'تاريخ الإصدار' },
            {
              key: 'actions',
              header: 'الإجراءات',
              render: (row) => {
                const cert = row._raw;
                const verify = certificateVerifyUrl(cert.certificateNumber);
                const pdf = certificatePdfUrl(cert.certificateNumber);
                return (
                  <div className="card-actions">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(cert)}>
                      التفاصيل
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => window.open(verify, '_blank')}>
                      تحقق
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => window.open(pdf, '_blank')}>
                      PDF
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => copyLink(verify)}>
                      <Copy size={14} />
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      </Card>

      <Modal isOpen={Boolean(selected)} title="تفاصيل الشهادة" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>رقم الشهادة</span><strong>{selected.certificateNumber}</strong></div>
            <div className="detail-row"><span>الطالب</span><strong>{selected.user?.fullName}</strong></div>
            <div className="detail-row"><span>البريد</span><strong>{selected.user?.email}</strong></div>
            <div className="detail-row"><span>الكورس</span><strong>{selected.course?.titleAr}</strong></div>
            <div className="detail-row"><span>المحاضر</span><strong>{selected.course?.instructor?.fullName || '—'}</strong></div>
            <div className="detail-row"><span>تاريخ الإصدار</span><strong>{fmtDate(selected.issuedAt)}</strong></div>
            <div className="detail-row">
              <span>ملف PDF</span>
              <Badge variant={selected.pdfUrl ? 'success' : 'warning'}>
                {selected.pdfUrl ? 'متاح' : 'غير متاح'}
              </Badge>
            </div>
            <div className="card-actions">
              <Button
                variant="secondary"
                icon={<ExternalLink size={16} />}
                onClick={() => window.open(certificateVerifyUrl(selected.certificateNumber), '_blank')}
              >
                التحقق من الشهادة
              </Button>
              <Button
                icon={<Download size={16} />}
                onClick={() => window.open(certificatePdfUrl(selected.certificateNumber), '_blank')}
              >
                تحميل PDF
              </Button>
              <Button
                variant="outline"
                icon={<Copy size={16} />}
                onClick={() => copyLink(certificateVerifyUrl(selected.certificateNumber))}
              >
                نسخ رابط التحقق
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={issueOpen} title="إصدار شهادة جديدة" onClose={() => setIssueOpen(false)}>
        {eligible.length ? (
          <div className="stack-sm">
            <p>الطلاب التاليون أكملوا الدورات ولم يصدر لهم شهادة بعد:</p>
            {eligible.map((enrollment) => (
              <div key={enrollment.id} className="session-card">
                <div className="session-card-info">
                  <h4>{enrollment.user?.fullName}</h4>
                  <p>{enrollment.course?.titleAr}</p>
                  <small>نسبة الإنجاز: {Number(enrollment.progressPercentage)}%</small>
                </div>
                <Button
                  size="sm"
                  loading={generating === enrollment.id}
                  onClick={() => issueCertificate(enrollment.id)}
                >
                  إصدار
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="لا يوجد طلاب مؤهلون"
            description="جميع الطلاب الذين أكملوا دوراتهم لديهم شهادات بالفعل."
            icon={Award}
          />
        )}
      </Modal>
    </div>
  );
}
