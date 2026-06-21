import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, CheckCircle2, Download, Home, XCircle } from 'lucide-react';
import { certificatesApi } from '../../api/certificates';
import { BrandMark } from '../../components/ui/BrandMark';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { certificatePdfUrl } from '../../utils/certificateUrls';

const fmtDate = (value?: string) => (value
  ? new Date(value).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
  : '—');

export default function CertificateVerifyPage() {
  const { certificateNumber = '' } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!certificateNumber) {
      setError('رقم الشهادة غير صالح.');
      setLoading(false);
      return;
    }
    certificatesApi.verify(decodeURIComponent(certificateNumber))
      .then(setData)
      .catch((err) => {
        setError(err?.response?.data?.message || 'الشهادة غير صحيحة أو غير موجودة.');
      })
      .finally(() => setLoading(false));
  }, [certificateNumber]);

  const pdfUrl = certificateNumber ? certificatePdfUrl(decodeURIComponent(certificateNumber)) : '';

  return (
    <div className="certificate-verify-page">
      <header className="certificate-verify-header">
        <BrandMark variant="compact" />
        <Link to="/login" className="certificate-verify-home">
          <Home size={16} />
          الرئيسية
        </Link>
      </header>

      <main className="certificate-verify-main">
        {loading ? (
          <Card className="certificate-verify-card">
            <p className="center-muted">جاري التحقق من الشهادة...</p>
          </Card>
        ) : error ? (
          <Card className="certificate-verify-card certificate-verify-invalid">
            <XCircle size={56} className="certificate-verify-icon invalid" />
            <h1>شهادة غير صالحة</h1>
            <p>{error}</p>
            <p className="certificate-verify-number">{decodeURIComponent(certificateNumber)}</p>
            <Link to="/login"><Button>العودة للمنصة</Button></Link>
          </Card>
        ) : (
          <Card className="certificate-verify-card certificate-verify-valid">
            <CheckCircle2 size={56} className="certificate-verify-icon valid" />
            <h1>شهادة صحيحة ومعتمدة</h1>
            <p>تم التحقق من صحة هذه الشهادة في منصة BI-ALEM.</p>

            <div className="certificate-verify-details">
              <div className="detail-row"><span>رقم الشهادة</span><strong>{data.certificateNumber}</strong></div>
              <div className="detail-row"><span>اسم الطالب</span><strong>{data.user?.fullName || '—'}</strong></div>
              <div className="detail-row"><span>الدورة</span><strong>{data.course?.titleAr || data.course?.titleEn || '—'}</strong></div>
              <div className="detail-row"><span>تاريخ الإصدار</span><strong>{fmtDate(data.issuedAt)}</strong></div>
            </div>

            <div className="certificate-verify-actions">
              <Button icon={<Download size={18} />} onClick={() => window.open(pdfUrl, '_blank')}>
                تحميل PDF
              </Button>
              <Button variant="secondary" icon={<Award size={18} />} onClick={() => window.print()}>
                طباعة
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
