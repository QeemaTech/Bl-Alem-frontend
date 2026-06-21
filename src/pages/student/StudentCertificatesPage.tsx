import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, BookOpen, Copy, Download, ExternalLink, GraduationCap, Search, Share2,
} from 'lucide-react';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { CourseGridSkeleton } from '../../components/ui/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Tabs } from '../../components/ui/Tabs';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { certificatePdfUrl, certificateVerifyUrl } from '../../utils/certificateUrls';
import { exportTableToExcel } from '../../utils/exportExcel';
import { mediaUrl } from '../../utils/mediaUrl';

const fmtDate = (value: string) => new Date(value).toLocaleDateString('ar-SA', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const exportColumns = [
  { key: 'course', header: 'الدورة' },
  { key: 'certificateNumber', header: 'رقم الشهادة' },
  { key: 'issuedAt', header: 'تاريخ الإصدار' },
  { key: 'verifyUrl', header: 'رابط التحقق' },
];

export default function StudentCertificatesPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    studentApi.certificates().then(setItems).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((c) =>
      [c.course?.titleAr, c.certificateNumber]
        .some((v) => String(v || '').toLowerCase().includes(q)),
    );
  }, [items, search]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const courses = new Set(items.map((i) => i.courseId));
    return {
      total: items.length,
      thisMonth: items.filter((i) => new Date(i.issuedAt) >= monthStart).length,
      courses: courses.size,
    };
  }, [items]);

  const copyLink = async (url: string, message = 'تم نسخ رابط التحقق.') => {
    await navigator.clipboard.writeText(`${window.location.origin}${url}`);
    showToast(message, 'success');
  };

  const shareCertificate = async (certificate: any) => {
    const verify = `${window.location.origin}${certificateVerifyUrl(certificate.certificateNumber)}`;
    const text = `شهادتي في "${certificate.course?.titleAr}" — تحقق منها: ${verify}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'شهادة إتمام', text, url: verify });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(text);
    showToast('تم نسخ رسالة المشاركة.', 'success');
  };

  const handleExport = () => {
    exportTableToExcel('شهاداتي', exportColumns, filtered.map((c) => ({
      course: c.course?.titleAr || '—',
      certificateNumber: c.certificateNumber,
      issuedAt: fmtDate(c.issuedAt),
      verifyUrl: `${window.location.origin}${certificateVerifyUrl(c.certificateNumber)}`,
    })));
    showToast('تم تصدير الشهادات.', 'success');
  };

  return (
    <div className="page-grid student-certificates-page">
      <div className="reports-header">
        <PageHeader
          title="الشهادات"
          subtitle="تظهر الشهادات تلقائياً بعد إكمال الدورة بنسبة 100%"
        />
        <div className="reports-actions">
          <Button variant="outline" onClick={handleExport} disabled={!filtered.length}>
            تصدير
          </Button>
          <Link to="/student/my-courses">
            <Button variant="secondary" icon={<BookOpen size={16} />}>كورساتي</Button>
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي الشهادات" value={String(stats.total)} icon={Award} />
        <StatCard title="هذا الشهر" value={String(stats.thisMonth)} icon={GraduationCap} />
        <StatCard title="دورات مُكتملة" value={String(stats.courses)} icon={BookOpen} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث باسم الدورة أو رقم الشهادة..."
        onSearchChange={setSearch}
        onReset={() => setSearch('')}
      />

      <Tabs
        variant="pills"
        activeTab={view}
        onChange={setView}
        tabs={[
          { id: 'grid', label: 'بطاقات' },
          { id: 'list', label: 'جدول' },
        ]}
      />

      {loading ? (
        <CourseGridSkeleton />
      ) : filtered.length ? (
        view === 'grid' ? (
          <div className="student-certificates-grid">
            {filtered.map((certificate) => {
              const verify = certificateVerifyUrl(certificate.certificateNumber);
              const pdf = certificatePdfUrl(certificate.certificateNumber);
              const cover = mediaUrl(certificate.course?.coverImage);
              return (
                <article key={certificate.id} className="student-certificate-card">
                  <div className="student-certificate-visual">
                    {cover ? (
                      <img src={cover} alt="" className="student-certificate-cover" />
                    ) : (
                      <div className="student-certificate-cover-fallback">
                        <Award size={40} />
                      </div>
                    )}
                    <div className="student-certificate-badge">
                      <Award size={16} />
                      <span>شهادة إتمام</span>
                    </div>
                  </div>
                  <div className="student-certificate-body">
                    <h3>{certificate.course?.titleAr || '—'}</h3>
                    <p className="student-certificate-date">
                      تاريخ الإصدار: {fmtDate(certificate.issuedAt)}
                    </p>
                    <p className="student-certificate-number" dir="ltr">
                      {certificate.certificateNumber}
                    </p>
                    <div className="student-certificate-actions">
                      <Button size="sm" icon={<Download size={16} />} onClick={() => window.open(pdf, '_blank')}>
                        تحميل PDF
                      </Button>
                      <Button variant="secondary" size="sm" icon={<ExternalLink size={16} />} onClick={() => window.open(verify, '_blank')}>
                        التحقق
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Copy size={16} />} onClick={() => copyLink(verify)}>
                        نسخ
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Share2 size={16} />} onClick={() => shareCertificate(certificate)}>
                        مشاركة
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <Card>
            <Table
              data={filtered}
              emptyTitle="لا توجد شهادات"
              columns={[
                { key: 'course', header: 'الدورة', render: (row) => String((row.course as any)?.titleAr || '—') },
                { key: 'certificateNumber', header: 'رقم الشهادة', render: (row) => <span dir="ltr">{String(row.certificateNumber)}</span> },
                { key: 'issuedAt', header: 'تاريخ الإصدار', render: (row) => fmtDate(String(row.issuedAt)) },
                {
                  key: 'pdf',
                  header: 'PDF',
                  render: (row) => (
                    <Badge variant={row.pdfUrl ? 'success' : 'pending'}>
                      {row.pdfUrl ? 'متاح' : 'يُولَّد عند التحميل'}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: 'الإجراءات',
                  render: (row) => (
                    <div className="table-actions">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(row)}>التفاصيل</Button>
                      <Button variant="outline" size="sm" onClick={() => window.open(certificatePdfUrl(String(row.certificateNumber)), '_blank')}>
                        PDF
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        )
      ) : items.length ? (
        <Card>
          <EmptyState title="لا نتائج" description="جرّب تغيير البحث." icon={Search} />
        </Card>
      ) : (
        <Card>
          <EmptyState
            title="لا توجد شهادات"
            description="أكمل دورة بنسبة 100% لتحصل على شهادتك تلقائياً."
            icon={Award}
            actionLabel="انتقل إلى كورساتي"
            onAction={() => { window.location.href = '/student/my-courses'; }}
          />
        </Card>
      )}

      <Modal isOpen={Boolean(selected)} title="تفاصيل الشهادة" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>الدورة</span><strong>{selected.course?.titleAr || '—'}</strong></div>
            <div className="detail-row"><span>رقم الشهادة</span><strong dir="ltr">{selected.certificateNumber}</strong></div>
            <div className="detail-row"><span>تاريخ الإصدار</span><strong>{fmtDate(selected.issuedAt)}</strong></div>
            <div className="detail-row">
              <span>ملف PDF</span>
              <Badge variant={selected.pdfUrl ? 'success' : 'pending'}>
                {selected.pdfUrl ? 'متاح' : 'يُولَّد عند التحميل'}
              </Badge>
            </div>
            <div className="card-actions">
              <Button icon={<Download size={16} />} onClick={() => window.open(certificatePdfUrl(selected.certificateNumber), '_blank')}>
                تحميل PDF
              </Button>
              <Button variant="secondary" icon={<ExternalLink size={16} />} onClick={() => window.open(certificateVerifyUrl(selected.certificateNumber), '_blank')}>
                صفحة التحقق
              </Button>
              <Button variant="ghost" icon={<Copy size={16} />} onClick={() => copyLink(certificateVerifyUrl(selected.certificateNumber))}>
                نسخ الرابط
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
